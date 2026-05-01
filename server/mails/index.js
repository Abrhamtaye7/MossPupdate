const MainLayout = require('./layout/MainLayout');
const WelcomeMailContent = require('./mails/WelcomeMail');

const WelcomeMail = (username = '{{nickname}}') => ({
  id: 1,
  name: '001 | Registration Welcome',
  subject: 'Welcome to MossPok!',
  text: ((username) =>
    `Hi ${username}!\n\nWelcome to MossPok and thank you for registering to our service!\n\nPlay now: https://www.mosspok.net \n\nEnjoy playing on our platform!\n\nThe MossPok Team
    `)(username),
  html: ((username) =>
    `${MainLayout(
      'Welcome to MossPok',
      username,
      WelcomeMailContent(),
    )}`)(username),
});

module.exports = {
  WelcomeMail,
};
