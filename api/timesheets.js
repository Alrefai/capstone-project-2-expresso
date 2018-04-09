const express = require('express');
const timesheetsRouter = express.Router({ mergeParams: true });

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE ||
                                './database.sqlite');

timesheetsRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Timesheet WHERE employee_id = ${req.params.employeeId}`,
    (err, rows) => {
      if (err) { return next(err) }
      if (!rows) { res.sendStatus(404) }
      res.send({ timesheets: rows })
    }
  );
});

const validateReqBody = (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date,
        employeeId = req.params.employeeId;

  if (!hours || !rate || !date) {
    return res.sendStatus(400);

  }
  req.newTimesheet = [hours, rate, date, employeeId];

  db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`,
    (err, row) => {
      if (err) { return next(err) }
      if (!row) { return res.sendStatus(404) }
      next();
    }
  );
};

timesheetsRouter.post('/', validateReqBody, (req, res, next) => {
  db.run(`INSERT INTO Timesheet (hours, rate, date, employee_id)
          VALUES ($hours, $rate, $date, $employeeId)`,
    {
      $hours: req.newTimesheet[0],
      $rate: req.newTimesheet[1],
      $date: req.newTimesheet[2],
      $employeeId: req.newTimesheet[3]
    },
    function(err) {
      if (err) { return next(err) }
      db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`,
        (err, row) => {
          if (err) { return next(err) }
          res.status(201).send({ timesheet: row });
        }
      );
    }
  );
});

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  db.get(`SELECT * FROM Timesheet WHERE id =${timesheetId}`, (err, row) => {
    if (err) { return next(err) }
    if (!row) { return res.sendStatus(404) }
    req.timesheet = row;
    next();
  });
});

timesheetsRouter.put('/:timesheetId', validateReqBody, (req, res, next) => {
  const timesheetId = req.params.timesheetId;
  db.run(`UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date,
          employee_id = $employeeId WHERE id = $timesheetId`,
    {
      $hours: req.newTimesheet[0],
      $rate: req.newTimesheet[1],
      $date: req.newTimesheet[2],
      $employeeId: req.newTimesheet[3],
      $timesheetId: timesheetId
    },
    function(err) {
      if (err) { return next(err) }
      db.get(`SELECT * FROM Timesheet WHERE id = ${timesheetId}`,
        (err, row) => {
          if (err) { return next(err) }
          res.send({ timesheet: row });
        }
      );
    }
  );
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const timesheetId = req.params.timesheetId;
  db.run(`DELETE FROM Timesheet WHERE id = ${timesheetId}`,
    function(err) {
      if (err) { return next(err) }
      res.sendStatus(204);
    }
  );
});


module.exports = timesheetsRouter;
