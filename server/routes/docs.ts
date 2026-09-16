import { Router, Request, Response } from 'express';

export const docsRouter = Router();

// GET /api/docs/spec - OpenAPI 3.0 specification
docsRouter.get('/spec', (req: Request, res: Response) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'TutorNest REST API Specification',
      version: '1.0.0',
      description: 'Production REST API for TutorNest – discovery, booking, learning, payments, and admin operations.',
      contact: {
        name: 'TutorNest Engineering',
        email: 'support@tutornest.in',
      },
    },
    servers: [
      {
        url: 'https://api.tutornest.in/api',
        description: 'Production Spring Boot API Gateway (https://api.tutornest.in)',
      },
      {
        url: '/api',
        description: 'Unified Dev Server / Container Proxy',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Token',
        },
      },
    },
    paths: {
      '/auth/login': {
        post: {
          summary: 'User Login',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } } } },
          },
          responses: {
            200: { description: 'Authenticated successfully with user and token' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/tutors': {
        get: {
          summary: 'Search and Filter Tutors',
          tags: ['Tutors'],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'subject', in: 'query', schema: { type: 'string' } },
            { name: 'minPrice', in: 'query', schema: { type: 'number' } },
            { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
            { name: 'minRating', in: 'query', schema: { type: 'number' } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['recommended', 'rating', 'price_asc', 'price_desc', 'experience'] } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
          ],
          responses: { 200: { description: 'Paginated list of verified tutors' } },
        },
      },
      '/bookings/initiate': {
        post: {
          summary: 'Initiate Booking (ACID Concurrency Lock & Price Calculation)',
          tags: ['Bookings'],
          security: [{ BearerAuth: [] }],
          responses: {
            201: { description: 'Booking initiated; Razorpay payment order generated' },
            409: { description: 'Double-booking conflict prevented (slot unavailable)' },
          },
        },
      },
      '/bookings/verify-and-confirm': {
        post: {
          summary: 'Server-side Payment Verification & Confirmation (Idempotent)',
          tags: ['Bookings', 'Payments'],
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Payment verified and booking confirmed' } },
        },
      },
      '/bookings/{id}/cancel': {
        post: {
          summary: 'Cancel Booking & Compute Refund Policy',
          tags: ['Bookings'],
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Booking cancelled and refund computed' } },
        },
      },
      '/reviews': {
        post: {
          summary: 'Submit Review (Guarded: strictly requires completed booking)',
          tags: ['Reviews'],
          security: [{ BearerAuth: [] }],
          responses: {
            201: { description: 'Review published and tutor rating recalculated' },
            400: { description: 'Session is not completed' },
            409: { description: 'Duplicate review not allowed' },
          },
        },
      },
      '/admin/analytics': {
        get: {
          summary: 'Platform Analytics KPIs & Financial Summary',
          tags: ['Administration'],
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'KPIs and charts dataset' } },
        },
      },
      '/admin/tutors/{id}/verify': {
        put: {
          summary: 'Approve or Reject Tutor Credential Application',
          tags: ['Administration'],
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Tutor status updated' } },
        },
      },
    },
  });
});
