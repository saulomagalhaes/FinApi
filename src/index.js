const express = require('express');
const { v4: uuidv4 } = require('uuid'); // V4 gera numeros randomicos

const app = express();
app.use(express.json());

const customers = [];

//Middleware
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((costumer) => costumer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: 'Customer not found' });
  }

  request.customer = customer; //Disponibiliza o customer para o proximo middleware ou para a rota

  return next();
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ error: 'Customer already exists' });
  }

  const id = uuidv4(); // Gera um id aleatorio(biblioteca uuid)

  customers.push({ cpf, name, id, statement: [] });

  return response.status(201).send();
});

// app.use(verifyIfExistsAccountCPF); //Chama assim quando o middleware for utilizado em toda a alicacao

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
});

app.listen(3333);

//MIDDLEWARES - interceptadores, ficam no meio campo entre a requisicao e a resposta
