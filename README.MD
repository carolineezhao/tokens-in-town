Tokens in Town dApp, by Tyler Berretta, Caroline Zhao, and Rahma Elsheikh

Note: Need to use npm install to get node-modules folder

Running the dApp locally (once all dependencies installed)
1. Run "ganache-cli --port 8545 --i 1337"
2. Connect one of ganache generated accounts to your Metamask in the browser
3. In your tokens-in-town folder, run "sudo truffle compile"
4. Run "sudo truffle deploy --network development"
5. Run "node server.js" (for Google Trend API)
6. Run "python3 -m http.server 8000"
7. Open the website at http://localhost:8000

When you open the website on http://localhost:8000/, you will be prompted to connect your Metamask account to the website. You may also need to reload the site once or twice to get the proper prompts to grant the user Minter / Burner roles. This will just allow you to explore the functionality of the dApp completely -- being able to see a Cashier perspective and a User perspective.
