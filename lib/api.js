import { NextResponse } from 'next/server';

export function json(data, init) {
  return NextResponse.json(data, init);
}

export function ok(data = {}, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message, status = 400, extra = {}) {
  return NextResponse.json({ message, ...extra }, { status });
}

export function parseSearchParams(request) {
  return new URL(request.url).searchParams;
}

export function serializeDocument(document) {
  return JSON.parse(JSON.stringify(document));
}