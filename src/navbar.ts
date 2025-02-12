import Fastify, { FastifyRequest } from 'fastify';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { URL } from 'url';

const fastify = Fastify();

// Read the custom overlay HTML from an external file
const overlayHtml = fs.readFileSync(path.resolve(__dirname, 'navbar.html'), 'utf-8');

// Read the warn.html file from the 'src' directory
const warnHtml = fs.readFileSync(path.resolve(__dirname, 'warn.html'), 'utf-8');
// Define an endpoint to serve the warn.html file
fastify.get('/warn', (request, reply) => {
  reply.type('text/html').send(warnHtml);
});

// Utility function to format headers
const formatHeaders = (headers: Record<string, any>): Record<string, string | number | string[] | undefined> => {
  const formattedHeaders: Record<string, string | number | string[] | undefined> = {};
  Object.keys(headers).forEach((key) => {
    formattedHeaders[key] = headers[key] as string | number | string[] | undefined;
  });
  return formattedHeaders;
};

// Define a proxy endpoint
fastify.get('/proxy', async (request: FastifyRequest<{ Querystring: { url: string } }>, reply) => {
  try {
    const targetUrl = request.query.url;
    if (!targetUrl) {
      return reply.status(400).send('Target URL is required');
    }

    // Decode the URL
    const decodedUrl = decodeURIComponent(targetUrl);
    const response = await axios.get(decodedUrl, {
      responseType: 'text',
    });

    // Check if the response is valid
    if (!response.data || response.data.trim().length === 0) {
      throw new Error('The response is empty or invalid HTML');
    }

    // Use jsdom to parse and manipulate the HTML
    const dom = new JSDOM(response.data, { url: decodedUrl });
    const document = dom.window.document;

    // Extract the logo and theme color
    const logoElement = document.querySelector('link[rel="icon"]');
    const themeColorElement = document.querySelector('meta[name="theme-color"]');

    const logo = logoElement ? new URL(logoElement.getAttribute('href')!, decodedUrl).toString() : '/path/to/default/logo.png';
    const themeColor = themeColorElement ? themeColorElement.getAttribute('content')! : '#007bff';

    // Customize the overlay HTML
    const customizedNavbar = overlayHtml
      .replace(/var\(--navbar-bg-color, #007bff\)/, themeColor)
      .replace(/var\(--navbar-text-color, #ffffff\)/, '#ffffff')
      .replace(/id="navbar-logo">Company/, `id="navbar-logo"><img src="${logo}" alt="Logo" style="max-height: 40px;">`);

    // Inject the customized navbar into the original page content
    const modifiedBody = customizedNavbar + response.data;

    // Format and send the response
    const formattedHeaders = formatHeaders(response.headers);
    reply.status(response.status).headers(formattedHeaders).send(modifiedBody);
  } catch (error: any) {
    console.error('Error during proxy handling:', error);
    reply.status(error.response?.status || 500).send(error.message);
  }
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 1515, host: '0.0.0.0' });
    console.log('Proxy server is running at http://localhost:1515');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();