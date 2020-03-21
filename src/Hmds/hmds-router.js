const path = require('path');
const express = require('express');
const xss = require('xss');
const logger = require('../logger');
const HmdsService = require('./hmds-service');

const HmdsRouter = express.Router();
const bodyParser = express.json();

const serializeHmd = hmd => ({
  id: hmd.id,
  name: xss(hmd.name),
  image: hmd.image,
  video: hmd.video,
  page: hmd.page,
  panel: hmd.panel,
  resolution: hmd.resolution,
  ppd: hmd.ppd,
  refrate: hmd.refrate,
  fov: hmd.fov,
  tracking: hmd.tracking,
  price: hmd.price,
  rating: hmd.rating,
});

HmdsRouter
  .route('/')
  .get((req, res, next) => {
    HmdsService.getAllDocs(req.app.get('db'))
      .then(hmds => {
        res.json(hmds.map(serializeHmd))
      })
      .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
    const { id, name, image, video, page, panel, resolution, ppd, refrate, fov, tracking, price, rating} = req.body;
    const newHmd = { id, name, image, video, page, panel, resolution, ppd, refrate, fov, tracking, price, rating};
    for (const field of ['name']) {
      if (!newHmd[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send({
          error: { message: `'${field}' is required` }
        });
      }
    }
    HmdsService.insertDoc(
      req.app.get('db'),
      newHmd
    )
      .then(hmd => {
        res
          .status(201)
          .json(serializeHmd(hmd))
      })
      .catch(next)
  });


  HmdsRouter
  .route('/:hmd_id')
  .all((req, res, next) => {
    const { hmd_id } = req.params
    HmdsService.getById(req.app.get('db'), hmd_id)
      .then(hmd => {
        if (!hmd) {
          logger.error(`Document with id ${hmd} not found.`);
          return res.status(404).json({
            error: { message: `Head Mounted Display Not Found` }
          });
        }

        res.hmd = hmd
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(serializeHmd(res.hmd))
  })
  .delete((req, res, next) => {
    const { hmd_id } = req.params
    HmdsService.deleteDoc(
      req.app.get('db'),
      hmd_id
    )
      .then(numRowsAffected => {
        logger.info(`Hmd with id ${hmd_id} deleted.`)
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(bodyParser, (req, res, next) => {
    const { rating } = req.body
    const hmdToUpdate = { rating }

    const numberOfValues = Object.values(hmdToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      logger.error(`Invalid update without required fields`)
      return res.status(400).json({
        error: {
          message: `Request body must contain 'rating'.`
        }
      });
    }

    HmdsService.updateDoc(
      req.app.get('db'),
      req.params.hmd_id,
      hmdToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  });

module.exports = HmdsRouter
