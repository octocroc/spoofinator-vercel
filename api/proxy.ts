import Fastify from 'fastify';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { VercelRequest, VercelResponse } from '@vercel/node';

const fastify = Fastify();

// Utility function to convert Axios headers to the required format
const formatHeaders = (headers: Record<string, any>): Record<string, string | number | string[] | undefined> => {
  const formattedHeaders: Record<string, string | number | string[] | undefined> = {};
  Object.keys(headers).forEach((key) => {
    formattedHeaders[key] = headers[key] as string | number | string[] | undefined;
  });
  return formattedHeaders;
};

// Read the custom overlay HTML from an external file
const overlayHtml = fs.readFileSync(path.resolve(__dirname, '../src/overlay.html'), 'utf-8');

// Read the warn.html file from the 'src' directory
const warnHtml = fs.readFileSync(path.resolve(__dirname, '../src/warn.html'), 'utf-8');

// Define an endpoint to serve the warn.html file
fastify.get('/warn', (request, reply) => {
  reply.type('text/html').send(warnHtml);
});

// Define a proxy endpoint that accepts the target domain as a query parameter
fastify.get('/proxy', async (request, reply) => {
  try {
    // Extract the target URL from the query parameter
    const targetUrl = request.query.url;

    if (!targetUrl) {
      return reply.status(400).send('Target URL is required');
    }

    // Decode the URL to handle any encoded characters
    const decodedUrl = decodeURIComponent(targetUrl);

    // Forward the request to the specified target URL
    const response = await axios.get(decodedUrl, {
      responseType: 'text', // Ensure the response is text/html
    });

    // Inject custom overlay HTML into the response body
    const modifiedBody = response.data + overlayHtml;

    // Format headers
    const formattedHeaders = formatHeaders(response.headers);

    // Return the modified response
    reply.status(response.status).headers(formattedHeaders).send(modifiedBody);
  } catch (error: any) {
    reply.status(error.response?.status || 500).send(error.message);
  }
});

// Wrap Fastify as a serverless handler function for Vercel
export default async (req: VercelRequest, res: VercelResponse) => {
  await fastify.ready();
  fastify.server.emit('request', req, res);
};
