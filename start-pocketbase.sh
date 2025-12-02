#!/bin/bash
# Quick script to start PocketBase for local development

cd "$(dirname "$0")"
# Disable automigrations to avoid applying stale pb_migrations; we manage schema via setup script.
./pocketbase/pocketbase serve --automigrate=false
