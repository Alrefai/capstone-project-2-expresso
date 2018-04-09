const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE ||
                                './database.sqlite');

employeesRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`,
    (err, rows) => {
      err ? next(err) : res.send({ employees: rows });
    }
  );
});

const validateReqBody = (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        isEmployed = req.body.employee.is_current_employee === 0 ? 0 : 1;
  name && position && wage ? (
    req.newEmployee = [name, position, wage, isEmployed],
    next()
  ) : res.sendStatus(400);
};

employeesRouter.post('/', validateReqBody, (req, res, next) => {
  db.run(`INSERT INTO Employee (name, position, wage, is_current_employee)
          VALUES ($name, $position, $wage, $isEmployed)`,
    {
      $name: req.newEmployee[0],
      $position: req.newEmployee[1],
      $wage: req.newEmployee[2],
      $isEmployed: req.newEmployee[3]
    },
    function(err) {
      if (err) { return next(err) }
      db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (err, row) => {
        err ? next(err) : res.status(201).send({ employee: row });
      });
    }
  );
});

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  db.get(`SELECT * FROM Employee WHERE id =${employeeId}`, (err, row) => {
    err ? next(err) : row ? (
      req.employee = row,
      next()
    ) : res.sendStatus(404);
  });
});

employeesRouter.get('/:employeeId', (req, res, next) => {
  res.send({ employee: req.employee })
})

employeesRouter.put('/:employeeId', validateReqBody, (req, res, next) => {
  const employeeId = req.params.employeeId;
  db.run(`UPDATE Employee SET name = $name, position = $position, wage = $wage,
          is_current_employee = $isEmployed WHERE id = $employeeId`,
    {
      $name: req.newEmployee[0],
      $position: req.newEmployee[1],
      $wage: req.newEmployee[2],
      $isEmployed: req.newEmployee[3],
      $employeeId: employeeId
    },
    function(err) {
      if (err) { return next(err) }
      db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`, (err, row) => {
        err ? next(err) : res.send({ employee: row });
      });
    }
  );
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
  const employeeId = req.params.employeeId;
  db.run(`UPDATE Employee SET is_current_employee = 0 WHERE id = ${employeeId}`,
    function(err) {
      if (err) { return next(err) }
      db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`, (err, row) => {
        err ? next(err) : res.send({ employee: row });
      });
    }
  );
});


module.exports = employeesRouter;
