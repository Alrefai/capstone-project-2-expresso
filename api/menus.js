const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE ||
                                './database.sqlite');

// const timesheetsRouter = require('./timesheets');

const validateReqBody = (req, res, next) => {
  const title = req.body.menu.title;
  title ? (
    req.newMenu = title,
    next()
  ) : res.sendStatus(400);
};

menusRouter.param('menuId', (req, res, next, menuId) => {
  db.get(`SELECT * FROM Menu WHERE id =${menuId}`, (err, row) => {
    err ? next(err) : row ? (
      req.menu = row,
      next()
    ) : res.sendStatus(404);
  });
});


menusRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Menu`,
    (err, rows) => {
      err ? next(err) : res.send({ menus: rows });
    }
  );
});

menusRouter.post('/', validateReqBody, (req, res, next) => {
  db.run(`INSERT INTO Menu (title) VALUES ($title)`,
    {
      $title: req.newMenu
    },
    function(err) {
      if (err) { return next(err) }
      db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (err, row) => {
        err ? next(err) : res.status(201).send({ menu: row });
      });
    }
  );
});

menusRouter.get('/:menuId', (req, res, next) => {
  res.send({ menu: req.menu })
})

menusRouter.put('/:menuId', validateReqBody, (req, res, next) => {
  const menuId = req.params.menuId;
  db.run(`UPDATE Menu SET title = $title WHERE id = $menuId`,
    {
      $title: req.newMenu,
      $menuId: menuId
    },
    function(err) {
      if (err) { return next(err) }
      db.get(`SELECT * FROM Menu WHERE id = ${menuId}`, (err, row) => {
        err ? next(err) : res.send({ menu: row });
      });
    }
  );
});

menusRouter.delete('/:menuId', (req, res, next) => {
  const menuId = req.params.menuId;
  db.get(`SELECT * FROM MenuItem WHERE menu_id = ${menuId}`,
    (err, row) => {
      if (err) { return next(err) }
      if (row) { return res.sendStatus(400) }
      db.run(`DELETE FROM Menu WHERE id = ${menuId}`, function(err) {
        err ? next(err) : res.sendStatus(204);
      });
    }
  );
});


// menusRouter.use('/:menuId/timesheets', timesheetsRouter);

module.exports = menusRouter;
