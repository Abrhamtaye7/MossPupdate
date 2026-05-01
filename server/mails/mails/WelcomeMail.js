const Button = require('../components/Button');
const ContentBlock = require('../components/ContentBlock');
const Text = require('../components/Text');

const WelcomeMailContent = () => `
${ContentBlock(
  `${Text(
    'Welcome to MossPok and thank you for registering to our service!',
  )}`,
)}
${Button('Play now!', 'https://www.mosspok.net')}
${ContentBlock(`${Text('Enjoy playing on our platform!')}`)}
`;

module.exports = WelcomeMailContent;
