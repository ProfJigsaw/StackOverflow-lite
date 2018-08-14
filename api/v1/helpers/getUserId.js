export default (users, username) => {
  let id = 0;
  users.map((obj) => {
    id = (obj.username === username) ? obj.userId : id;
    return false;
  });
  return id;
};
