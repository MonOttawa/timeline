import Fastify from 'fastify';
import PocketBase from 'pocketbase';
import { chromium } from 'playwright';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const {
  PORT = 8080,
  API_KEY,
  POCKETBASE_URL = 'http://pocketbase:8090',
  POCKETBASE_EMAIL,
  POCKETBASE_PASSWORD,
  RENDER_BASE_URL = 'http://web',
  AI_BASE_URL = 'https://openrouter.ai/api/v1',
  AI_API_KEY,
  AI_MODEL,
  S3_ENDPOINT,
  S3_REGION = 'us-east-1',
  S3_BUCKET,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_PUBLIC_URL,
  S3_FORCE_PATH_STYLE = 'false'
} = process.env;

const fastify = Fastify({ logger: true, bodyLimit: 5 * 1024 * 1024 });

const pb = new PocketBase(POCKETBASE_URL);

const s3Client = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  forcePathStyle: S3_FORCE_PATH_STYLE === 'true',
  credentials: S3_ACCESS_KEY && S3_SECRET_KEY ? {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY
  } : undefined
});

const requireApiKey = async (request, reply) => {
  const key = request.headers['x-api-key'];
  if (!API_KEY || key !== API_KEY) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
};

const slugify = (text = '') => text
  .toString()
  .toLowerCase()
  .trim()
  .replace(/\s+/g, '-')
  .replace(/[^\w-]+/g, '')
  .replace(/--+/g, '-')
  .replace(/^-+/, '')
  .replace(/-+$/, '');

const makeUniqueSlug = (base) => `${base}-${Math.random().toString(36).slice(2, 8)}`;

const ensureServiceAuth = async () => {
  if (pb.authStore.isValid) return pb.authStore.model;
  if (!POCKETBASE_EMAIL || !POCKETBASE_PASSWORD) {
    throw new Error('Missing PocketBase service credentials');
  }
  const auth = await pb.collection('users').authWithPassword(POCKETBASE_EMAIL, POCKETBASE_PASSWORD);
  return auth.record;
};

const generateMarkdown = async ({ title, notes }) => {
  if (!AI_API_KEY || !AI_MODEL) {
    throw new Error('AI generation not configured. Provide markdown directly or set AI_API_KEY/AI_MODEL.');
  }

  const prompt = `You are a timeline generator. Convert the input into a markdown timeline with this format:
\n# ${title}
\n*Date*\n### Title\nDescription\n\n---\n\nRepeat for each event.
\nInput:\n${notes}`;

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: 'Generate markdown timelines in the required format.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI provider error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('AI provider returned empty content');
  return content;
};

const normalizeMarkdown = (title, markdown) => {
  if (!markdown.startsWith('#')) {
    return `# ${title}\n\n${markdown}`;
  }
  return markdown;
};

const renderTimeline = async ({ markdown, style, title }) => {
  const encoded = encodeURIComponent(Buffer.from(markdown, 'utf8').toString('base64'));
  const styleParam = encodeURIComponent(style || 'bauhaus-mono');
  const titleParam = encodeURIComponent(title || 'Timeline');

  const url = `${RENDER_BASE_URL}/render?md=${encoded}&style=${styleParam}&title=${titleParam}`;

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('#timeline-container', { timeout: 15000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);

    const element = await page.$('#timeline-container');
    if (!element) throw new Error('Render container not found');

    const buffer = await element.screenshot({ type: 'png' });
    return buffer;
  } finally {
    await browser.close();
  }
};

const uploadToS3 = async (buffer, key) => {
  if (!S3_BUCKET || !S3_PUBLIC_URL) {
    throw new Error('Missing S3_BUCKET or S3_PUBLIC_URL');
  }

  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
    ACL: 'public-read'
  }));

  const base = S3_PUBLIC_URL.replace(/\/$/, '');
  return `${base}/${key}`;
};

fastify.get('/health', async () => ({ ok: true }));

fastify.post('/api/v1/timelines/compose', { preHandler: requireApiKey }, async (request, reply) => {
  const { title, notes, markdown, style } = request.body || {};

  if (!title || typeof title !== 'string') {
    return reply.code(400).send({ error: 'title is required' });
  }

  if (!markdown && !notes) {
    return reply.code(400).send({ error: 'Provide notes or markdown' });
  }

  const selectedStyle = style || 'bauhaus-mono';

  const serviceUser = await ensureServiceAuth();

  const rawMarkdown = markdown || await generateMarkdown({ title, notes });
  const normalizedMarkdown = normalizeMarkdown(title, rawMarkdown);

  const slug = makeUniqueSlug(slugify(title || 'timeline'));

  const record = await pb.collection('timelines').create({
    user: serviceUser.id,
    title,
    content: normalizedMarkdown,
    style: selectedStyle,
    slug,
    public: false,
    viewCount: 0
  });

  const image = await renderTimeline({ markdown: normalizedMarkdown, style: selectedStyle, title });
  const key = `timelines/${record.id}.png`;
  const imageUrl = await uploadToS3(image, key);

  return {
    timelineId: record.id,
    markdown: normalizedMarkdown,
    imageUrl
  };
});

const start = async () => {
  try {
    await fastify.listen({ port: Number(PORT), host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
