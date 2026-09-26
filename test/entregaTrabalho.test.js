import request from 'supertest';
import { expect } from 'chai';
import app from '../src/app.js';
import { loginAdmin, loginAluno } from './helpers/auth.js';
import cenarios from './fixtures/alunos.json' with { type: 'json' };

describe('Fluxo de entrega de trabalho', () => {
  let tokenAdmin;

  before(async () => {
    tokenAdmin = await loginAdmin();
  });

  it('deve logar como administrador', () => {
    expect(tokenAdmin).to.be.a('string').and.not.be.empty;
  });

  cenarios.forEach(({ descricao, aluno, disciplinaId, trabalho }) => {
    describe(`Cenário: ${descricao}`, () => {
      const sufixo = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const dadosAluno = {
        ...aluno,
        email: aluno.email.replace('@', `+${sufixo}@`),
        matricula: `${aluno.matricula}-${sufixo}`,
      };
      let alunoId;
      let tokenAluno;

      it('admin deve cadastrar o aluno', async () => {
        const resposta = await request(app)
          .post('/api/admin/alunos')
          .set('Authorization', `Bearer ${tokenAdmin}`)
          .send(dadosAluno);

        expect(resposta.status).to.equal(201);
        expect(resposta.body).to.include({ nome: dadosAluno.nome, email: dadosAluno.email });
        expect(resposta.body).to.not.have.property('senha');
        alunoId = resposta.body.id;
      });

      it('admin deve matricular o aluno na disciplina', async () => {
        const resposta = await request(app)
          .post(`/api/admin/disciplinas/${disciplinaId}/matriculas`)
          .set('Authorization', `Bearer ${tokenAdmin}`)
          .send({ alunoId });

        expect(resposta.status).to.equal(201);
      });

      it('deve logar como o aluno cadastrado', async () => {
        tokenAluno = await loginAluno(dadosAluno.email, dadosAluno.senha);
        expect(tokenAluno).to.be.a('string').and.not.be.empty;
      });

      it('aluno deve registrar a entrega do trabalho', async () => {
        const resposta = await request(app)
          .post(`/api/alunos/${alunoId}/trabalhos`)
          .set('Authorization', `Bearer ${tokenAluno}`)
          .send({ disciplinaId, ...trabalho });

        expect(resposta.status).to.equal(201);
        expect(resposta.body).to.include({
          alunoId,
          disciplinaId,
          titulo: trabalho.titulo,
          status: 'entregue',
        });
      });
    });
  });
});
