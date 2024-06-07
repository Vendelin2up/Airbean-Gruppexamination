import express from 'express'
const router = express.Router()


router.get('/', (req, res) => {
  const aboutInfo = {
    company: "Airbean Coffee",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    coffeeProduction:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  };
  res.send(`
    <p><strong>Company:</strong> ${aboutInfo.company}</p>
    <p>${aboutInfo.description}</p>
    <p><strong>Coffee Production:</strong></p>
    <p>${aboutInfo.coffeeProduction}</p>
    `);
  })

  export default router;