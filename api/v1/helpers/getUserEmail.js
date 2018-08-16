export default (users, username) => {
  let email = '';
  users.map((obj) => {
    email = (obj.username === username) ? obj.email : email;
    return false;
  });
  return email;
};
