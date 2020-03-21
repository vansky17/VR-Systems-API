const HmdsService = {
  getAllDocs(knex) {
    return knex.select("*").from("hmds");
  },
  getById(knex, id) {
    return knex
      .from("hmds")
      .select("*")
      .where("id", id)
      .first();
  },
  insertDoc(knex, newDoc) {
    return knex
      .insert(newDoc)
      .into("hmds")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  },
  deleteDoc(knex, id) {
    return knex("hmds")
      .where({ id })
      .delete();
  },
  updateDoc(knex, id, newDocFields) {
    return knex("hmds")
      .where({ id })
      .update(newDocFields);
  }
};
module.exports = HmdsService;