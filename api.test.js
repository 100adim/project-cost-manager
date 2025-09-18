// api.test.js
// Unit tests for REST API with Jest + Supertest

const request = require('supertest');
const app = require('./app'); 
const mongoose = require('mongoose');

describe('RESTful API Tests', () => {

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ---- Test 1: /api/about ----
  it('GET /api/about → should return team members', async () => {
    const res = await request(app).get('/api/about');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('first_name');
    expect(res.body[0]).toHaveProperty('last_name');
  }, 15000);

  // ---- Test 2: /api/users (POST) ----
// This test verifies that adding the predefined user 'mosh israeli' works correctly.
// According to the project requirements, the DB should only contain one user (id=123123).
it('POST /api/users → should add the main user (mosh israeli)', async () => {
  const user = {
    id: 123123,                    // fixed ID for the main user
    first_name: 'mosh',            // required first name
    last_name: 'israeli',          // required last name
    birthday: '2000-01-01'         // sample birthday 
  };

  const res = await request(app)
    .post('/api/users')            // endpoint to add new users
    .send(user)                    // send JSON payload
    .set('Content-Type', 'application/json');

  // Verify HTTP status code is either 200 (OK) or 201 (Created)
  expect([200, 201]).toContain(res.statusCode);

  // Verify that the response body contains the correct properties
  expect(res.body).toHaveProperty('id', 123123);
  expect(res.body).toHaveProperty('first_name', 'mosh');
  expect(res.body).toHaveProperty('last_name', 'israeli');
  expect(res.body).toHaveProperty('birthday');
}, 15000);

  // ---- Test 3: /api/users (list) ----
  it('GET /api/users → should return all users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ---- Test 4: /api/users/:id ----
  it('GET /api/users/:id → should return details with total costs', async () => {
    const res = await request(app).get('/api/users/123123');
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('id', 123123);
      expect(res.body).toHaveProperty('first_name');
      expect(res.body).toHaveProperty('last_name');
      expect(res.body).toHaveProperty('total');
    } else {
      expect(res.statusCode).toBe(404);
    }
  });

  // ---- Test 5: /api/add ----
  it('POST /api/add → should add a cost item', async () => {
    const cost = {
      description: 'milk test',
      category: 'food',
      userid: 123123,
      sum: 12.5
    };
    const res = await request(app)
      .post('/api/add')
      .send(cost)
      .set('Content-Type', 'application/json');
//verify of response,description,category and user id
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('description', cost.description);
    expect(res.body).toHaveProperty('category', cost.category);
    expect(Number(res.body.userid)).toBe(cost.userid);
  });

  // ---- Test 6: /api/report ----
  it('GET /api/report → should return monthly report', async () => {
    const today = new Date();
    const res = await request(app).get(
      `/api/report?id=123123&year=${today.getFullYear()}&month=${today.getMonth() + 1}`
    );
//checking conditions 
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('userid');
      expect(res.body).toHaveProperty('year');
      expect(res.body).toHaveProperty('month');
      expect(res.body).toHaveProperty('costs');
    } else {
      expect([400, 404]).toContain(res.statusCode);
    }
  });

  // ---- Test 7: /api/logs ----
  it('GET /api/logs → should return logs', async () => {
    const res = await request(app).get('/api/logs');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
