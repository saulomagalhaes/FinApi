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
//Functions
function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    }
    return acc - operation.amount;
  }, 0);
  return balance;
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

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { amount, description } = request.body;

  const { customer } = request;

  const statemantOperation = {
    description: description,
    amount: amount,
    creat_at: new Date(),
    type: 'credit',
  };

  customer.statement.push(statemantOperation);

  return response.status(201).send();
});

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: 'Insufficient funds' });
  }

  const statemantOperation = {
    amount: amount,
    creat_at: new Date(),
    type: 'debit',
  };

  customer.statement.push(statemantOperation);

  return response.status(201).send();
});

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + ' 00:00');

  const statement = customer.statement.filter(
    (statement) =>
      statement.creat_at.toDateString() === new Date(dateFormat).toDateString()
  );

  return response.json(statement);
});

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
});

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json(customers);
});

app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json({ balance });
});
app.listen(3333);
//MIDDLEWARES - interceptadores, ficam no meio campo entre a requisicao e a resposta
