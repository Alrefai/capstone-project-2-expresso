const express = require('express');
const menuItemsRouter = express.Router({ mergeParams: true });

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE ||
                                './database.sqlite');

menuItemsRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM MenuItem WHERE menu_id = ${req.params.menuId}`,
    (err, rows) => {
      if (err) { return next(err) }
      if (!rows) { res.sendStatus(404) }
      res.send({ menuItems: rows })
    }
  );
});

const validateReqBody = (req, res, next) => {
  const name = req.body.menuItem.name,
        description = req.body.menuItem.description,
        inventory = req.body.menuItem.inventory,
        price = req.body.menuItem.price,
        menuId = req.params.menuId;

  if (!name || !description || !inventory || !price) {
    return res.sendStatus(400);
  }
  req.newMenuItem = [name, description, inventory, price, menuId];

  db.get(`SELECT * FROM Menu WHERE id = ${menuId}`, (err, row) => {
      if (err) { return next(err) }
      if (!row) { return res.sendStatus(404) }
      next();
  });
};

menuItemsRouter.post('/', validateReqBody, (req, res, next) => {
  db.run(`INSERT INTO MenuItem (name, description, inventory, price, menu_id)
          VALUES ($name, $description, $inventory, $price, $menuId)`,
    {
      $name: req.newMenuItem[0],
      $description: req.newMenuItem[1],
      $inventory: req.newMenuItem[2],
      $price: req.newMenuItem[3],
      $menuId: req.newMenuItem[4]
    },
    function(err) {
      if (err) { return next(err) }
      db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`,
        (err, row) => {
          if (err) { return next(err) }
          res.status(201).send({ menuItem: row });
        }
      );
    }
  );
});

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  db.get(`SELECT * FROM MenuItem WHERE id =${menuItemId}`, (err, row) => {
    if (err) { return next(err) }
    if (!row) { return res.sendStatus(404) }
    req.menuItem = row;
    next();
  });
});

menuItemsRouter.put('/:menuItemId', validateReqBody, (req, res, next) => {
  const menuItemId = req.params.menuItemId;
  db.run(`UPDATE MenuItem SET name = $name, description = $description,
          inventory = $inventory, price = $price, menu_id = $menuId
          WHERE id = $menuItemId`,
    {
      $name: req.newMenuItem[0],
      $description: req.newMenuItem[1],
      $inventory: req.newMenuItem[2],
      $price: req.newMenuItem[3],
      $menuId: req.newMenuItem[4],
      $menuItemId: menuItemId
    },
    function(err) {
      if (err) { return next(err) }
      db.get(`SELECT * FROM MenuItem WHERE id = ${menuItemId}`,
        (err, row) => {
          if (err) { return next(err) }
          res.send({ menuItem: row });
        }
      );
    }
  );
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  const menuId = req.params.menuId;
  const menuItemId = req.params.menuItemId;
  db.get(`SELECT * FROM menu WHERE id = ${menuId}`, (err, row) => {
    if (err) { return next(err) }
    if (!row) { return res.sendStatus(404) }
  });
  db.run(`DELETE FROM MenuItem WHERE id = ${menuItemId}`,
    function(err) {
      if (err) { return next(err) }
      res.sendStatus(204);
    }
  );
});


module.exports = menuItemsRouter;
