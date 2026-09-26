import request from 'supertest';
import app from '../../src/app.js';

export async function loginAdmin() {
  const resposta = await request(app)
    .post('/api/auth/login')
    .send({ email: process.env.ADMIN_EMAIL, senha: process.env.ADMIN_SENHA });
  return resposta.body.token;
}

export async function loginAluno(email, senha) {
  const resposta = await request(app).post('/api/auth/login').send({ email, senha });
  return resposta.body.token;
}
