const App = {
    web3: null,
    account: null,
    meta: null,

    smallWorldVotes: [0, 0, 0],
    gardenVotes:    [0, 0, 0],
    swVoted: false,
    gtVoted: false,

    start: async function() {
        const { web3 } = this;
        const [CoffeeArtifact, SandwichArtifact, TicketArtifact, IceCreamArtifact, SwapArtifact, NFTArtifact] = await Promise.all([
            fetch("/build/contracts/tigerCoffee.json").then(res => res.json()),
            fetch("/build/contracts/tigerSandwich.json").then(res => res.json()),
            fetch("/build/contracts/tigerTicket.json").then(res => res.json()),
            fetch("/build/contracts/tigerIceCream.json").then(res => res.json()),
            fetch("/build/contracts/DynamicSwap.json").then(res => res.json()),
            fetch("/build/contracts/NFTsInTown.json").then(res => res.json())

        ]);

        try {
            const networkId = await web3.eth.net.getId();
            console.log(networkId)
            const contracts_to_deploy = ['tigerCoffee', 'tigerSandwich', 'tigerTicket', 'tigerIceCream', 'DynamicSwap', 'NFTsInTown']
            var deployedNetworks = {}
            deployedNetworks['tigerCoffee'] = CoffeeArtifact.networks[networkId];
            deployedNetworks['tigerSandwich'] = SandwichArtifact.networks[networkId];
            deployedNetworks['tigerTicket'] = TicketArtifact.networks[networkId];
            deployedNetworks['tigerIceCream'] = IceCreamArtifact.networks[networkId];
            deployedNetworks['DynamicSwap'] = SwapArtifact.networks[networkId];
            deployedNetworks['NFTsInTown'] = NFTArtifact.networks[networkId];
            
            var contractABI = {}
            contractABI['tigerCoffee'] = CoffeeArtifact.abi;
            contractABI['tigerSandwich'] = SandwichArtifact.abi;
            contractABI['tigerTicket'] = TicketArtifact.abi;
            contractABI['tigerIceCream'] = IceCreamArtifact.abi;
            contractABI['DynamicSwap'] = SwapArtifact.abi;
            contractABI['NFTsInTown'] = NFTArtifact.abi;
            console.log(contractABI['tigerCoffee']);

            this.meta = {};
            for (name of contracts_to_deploy) {
                this.meta[name] = new web3.eth.Contract(
                    contractABI[name],
                    deployedNetworks[name].address,
                );
            }
            const accounts = await web3.eth.getAccounts();
            this.accounts = accounts;


            console.log("Coffee artifact networks:", CoffeeArtifact.networks);
            console.log("Using network ID:", networkId);
            console.log("Deployed coffee contract:", CoffeeArtifact.networks[networkId]);
            this.setup();
            this.initVotesDisplay();

        } catch (error) {
            console.error(error);
            console.error("Could not connect to contract or chain.");
        }
    },

    grantRoles: async function(contractName) {
        const sender = this.accounts[0];
        try {
            const minterRole = await this.meta[contractName].methods.MINTER_ROLE().call();
            const burnerRole = await this.meta[contractName].methods.BURNER_ROLE().call();
            // Grant role to sender if needed
            const senderHasRole = await this.meta[contractName].methods.hasRole(minterRole, sender).call();
            if (!senderHasRole) {
                console.log(`Granting MINTER and BURNER role to sender (${sender}) for ${contractName}`);
                // Optionally, you can estimate gas to see if it passes
                const estGas = await this.meta[contractName].methods.grantRole(minterRole, sender).estimateGas({ from: sender });
                console.log(`Estimated gas for sender role grant: ${estGas}`);
                await this.meta[contractName].methods.grantRole(minterRole, sender).send({
                    from: sender,
                    gasPrice: '20000000000',
                    gas: '3000000'
                });
                await this.meta[contractName].methods.grantRole(burnerRole, sender).send({
                    from: sender,
                    gasPrice: '20000000000',
                    gas: '3000000'
                });
            }

            // Grant role to the DynamicSwap contract if needed.
            const dynamicSwapAddress = this.meta['DynamicSwap'].options.address;
            const swapHasRole = await this.meta[contractName].methods.hasRole(minterRole, dynamicSwapAddress).call();
            if (!swapHasRole) {
                console.log(`Granting MINTER and BURNER role to DynamicSwap (${dynamicSwapAddress}) for ${contractName}`);
                await this.meta[contractName].methods.grantRole(minterRole, dynamicSwapAddress).send({
                    from: sender,
                    gasPrice: '20000000000',
                    gas: '3000000'
                });
                await this.meta[contractName].methods.grantRole(burnerRole, dynamicSwapAddress).send({
                    from: sender,
                    gasPrice: '20000000000',
                    gas: '3000000'
                });
                // For debugging, consider commenting out this block if it causes issues:
                /*
                const estGasSwap = await this.meta[contractName].methods.grantRole(minterRole, dynamicSwapAddress).estimateGas({ from: sender });
                console.log(`Estimated gas for DynamicSwap role grant: ${estGasSwap}`);
                await this.meta[contractName].methods.grantRole(minterRole, dynamicSwapAddress).send({
                    from: sender,
                    gasPrice: '20000000000',
                    gas: '3000000'
                });
                await this.meta[contractName].methods.grantRole(burnerRole, dynamicSwapAddress).send({
                    from: sender,
                    gasPrice: '20000000000',
                    gas: '3000000'
                });
                */
            }
        } catch (error) {
            console.error(`Error in grantRoles for ${contractName}:`, error);
            this.setStatus(`grantRoles error for ${contractName}: ${error.message}`);
            // Depending on your debugging needs, you may choose not to rethrow the error here.
        }
    },

    setup: async function() {
        await this.grantRoles('tigerCoffee');
        await this.grantRoles('tigerSandwich');
        await this.grantRoles('tigerTicket');
        await this.grantRoles('tigerIceCream');
    },

    refreshBalance: async function() {
        await this.refreshBalanceCoffee();
        await this.refreshBalanceSandwich();
        await this.refreshBalanceTicket();
        await this.refreshBalanceIceCream();
        // await this.refreshReserves();
    },

    refreshBalanceCoffee: async function() {
        try {
            const balance = await this.meta['tigerCoffee'].methods.balanceOf(this.accounts[0]).call();
            const balanceElement = document.getElementsByClassName("balanceCoffee");
            balanceElement[0].innerHTML = (Number(balance) / 1e8).toFixed(8);
            balanceElement[1].innerHTML = (Number(balance) / 1e8).toFixed(8);

        } catch (error) {
            console.error("Error refreshing Coffee balance:", error);
        }
    },

    refreshBalanceSandwich: async function() {
        try {
            const balance = await this.meta['tigerSandwich'].methods.balanceOf(this.accounts[0]).call();
            const balanceElement = document.getElementsByClassName("balanceSandwich");
            balanceElement[0].innerHTML = (Number(balance) / 1e8).toFixed(8);
            balanceElement[1].innerHTML = (Number(balance) / 1e8).toFixed(8);

        } catch (error) {
            console.error("Error refreshing Sandwich balance:", error);
        }
    },

    refreshBalanceTicket: async function() {
        try {
            const balance = await this.meta['tigerTicket'].methods.balanceOf(this.accounts[0]).call();
            const balanceElement = document.getElementsByClassName("balanceTicket");
            balanceElement[0].innerHTML = (Number(balance) / 1e8).toFixed(8);
            // balanceElement[1].innerHTML = (Number(balance) / 1e8).toFixed(8);

        } catch (error) {
            console.error("Error refreshing Ticket balance:", error);
        }
    },

    refreshBalanceIceCream: async function() {
        try {
            const balance = await this.meta['tigerIceCream'].methods.balanceOf(this.accounts[0]).call();
            const balanceElement = document.getElementsByClassName("balanceIceCream");
            balanceElement[0].innerHTML = (Number(balance) / 1e8).toFixed(8);
            // balanceElement[1].innerHTML = (Number(balance) / 1e8).toFixed(8);

        } catch (error) {
            console.error("Error refreshing Ice Cream balance:", error);
        }
    },

    updateCoffeeBalance: async function() {
        const target = document.getElementById("targetAddressCoffeeCashier").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Coffee.");
            return;
        }
        try {
            const balance = await this.meta['tigerCoffee'].methods.balanceOf(target).call();
            const balanceElement = document.getElementsByClassName("custBalanceCoffee");
            balanceElement[0].innerHTML = (Number(balance) / 1e8).toFixed(8);
        } catch (error) {
            console.error("Error refreshing Coffee balance:", error);
        }
    },

    updateSandwichBalance: async function() {
        const target = document.getElementById("targetAddressSandwichCashier").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Sandwich.");
            return;
        }
        try {
            const balance = await this.meta['tigerSandwich'].methods.balanceOf(target).call();
            const balanceElement = document.getElementsByClassName("custBalanceSandwich");
            balanceElement[0].innerHTML = (Number(balance) / 1e8).toFixed(8);
        } catch (error) {
            console.error("Error refreshing Sandwich balance:", error);
        }
    },

    updateTicketBalance: async function() {
        const target = document.getElementById("targetAddressTicketCashier").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Ticket.");
            return;
        }
        try {
            const balance = await this.meta['tigerTicket'].methods.balanceOf(target).call();
            const balanceElement = document.getElementsByClassName("custBalanceTicket");
            balanceElement[0].innerHTML = (Number(balance) / 1e8).toFixed(8);
        } catch (error) {
            console.error("Error refreshing Ticket balance:", error);
        }
    },

    updateIceCreamBalance: async function() {
        const target = document.getElementById("targetAddressIceCreamCashier").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Ice Cream.");
            return;
        }
        try {
            const balance = await this.meta['tigerIceCream'].methods.balanceOf(target).call();
            const balanceElement = document.getElementsByClassName("custBalanceIceCream");
            balanceElement[0].innerHTML = (Number(balance) / 1e8).toFixed(8);
        } catch (error) {
            console.error("Error refreshing Ice Cream balance:", error);
        }
    },

    refCoffee: async function() {
        const target = document.getElementById("targetAddressPassport").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Passport.");
            return;
        }
        try {
            const balance = await this.meta['tigerCoffee'].methods.balanceOf(target).call();
            const floatBalance = (Number(balance) / 1e8);

            return floatBalance; // Return the float
        } catch (error) {
            console.error("Error refreshing Coffee balance:", error);
            return null; // Return something fallback-ish on error
        }
    },
    refSandwich: async function() {
        const target = document.getElementById("targetAddressPassport").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Passport.");
            return;
        }
        try {
            const balance = await this.meta['tigerSandwich'].methods.balanceOf(target).call();
            const floatBalance = (Number(balance) / 1e8).toFixed(8);
            return floatBalance; // Return the float
        } catch (error) {
            console.error("Error refreshing Sandwich balance:", error);
            return null; // Return something fallback-ish on error
        }
    },
    refTicket: async function() {
        const target = document.getElementById("targetAddressPassport").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Passport.");
            return;
        }
        try {
            const balance = await this.meta['tigerTicket'].methods.balanceOf(target).call();
            const floatBalance = (Number(balance) / 1e8).toFixed(8);
            return floatBalance; // Return the float
        } catch (error) {
            console.error("Error refreshing Sandwich balance:", error);
            return null; // Return something fallback-ish on error
        }
    },
    refIceCream: async function() {
        const target = document.getElementById("targetAddressPassport").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Passport.");
            return;
        }
        try {
            const balance = await this.meta['tigerIceCream'].methods.balanceOf(target).call();
            const floatBalance = (Number(balance) / 1e8);

            return floatBalance; // Return the float
        } catch (error) {
            console.error("Error refreshing Ice Cream balance:", error);
            return null; // Return something fallback-ish on error
        }
    },

    approve: async function(contractName, to, amount) {
        try {
            await this.meta[contractName].methods.approve(to, amount).send({
                from: this.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });
        } catch (error) {
            console.error(`Approval error for ${contractName}:`, error);
            this.setStatus(`Approval error: ${error.message}`);
        }
    },

    purchaseCoffee: async function() {
        const target = document.getElementById("targetAddressCoffeeCashier").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Coffee purchase.");
            return;
        }
        this.setStatus("Initiating token purchase for Coffee... (please wait)");
        
        try {
            await App.meta['tigerCoffee'].methods.purchase(target).send({ 
                from: App.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });
            await this.updateCoffeeBalance();
            this.setStatus("Purchase complete for Tiger Coffee!");
        } catch (error) {
            console.error("Purchase of Coffee error:", error);
            this.setStatus("Purchase failed: " + error.message);
        }
    },

    redeemCoffee: async function() {
        const target = document.getElementById("targetAddressCoffeeCashier").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Coffee redemption.");
            return;
        }
        this.setStatus("Initiating token redemption for Coffee... (please wait)");
        try {
            await App.meta['tigerCoffee'].methods.redeem(target).send({ 
                from: App.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });
            await this.updateCoffeeBalance();
            this.setStatus("Redemption complete for Tiger Coffee!");
        } catch (error) {
            console.error("Redemption of Coffee error:", error);
            this.setStatus("Redemption failed: " + error.message);
        }
    },

    purchaseSandwich: async function() {
        const target = document.getElementById("targetAddressSandwichCashier").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Sandwich purchase.");
            return;
        }
        this.setStatus("Initiating token purchase for Sandwich... (please wait)");
        try {
            await App.meta['tigerSandwich'].methods.purchase(target).send({ 
                from: App.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });
            await this.updateSandwichBalance();
            this.setStatus("Purchase complete for Tiger Sandwich!");
        } catch (error) {
            console.error("Purchase of Sandwich error:", error);
            this.setStatus("Purchase failed: " + error.message);
        }
    },

    redeemSandwich: async function() {
        const target = document.getElementById("targetAddressSandwichCashier").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Sandwich redemption.");
            return;
        }
        this.setStatus("Initiating token redemption for Sandwich... (please wait)");
        try {
            await App.meta['tigerSandwich'].methods.redeem(target).send({ 
                from: App.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });
            await this.updateSandwichBalance();
            this.setStatus("Redemption complete for Tiger Sandwich!");
        } catch (error) {
            console.error("Redemption of Sandwich error:", error);
            this.setStatus("Redemption failed: " + error.message);
        }
    },

    purchaseTicket: async function() {
        const target = document.getElementById("targetAddressTicketCashier").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Ticket purchase.");
            return;
        }
        this.setStatus("Initiating token purchase for ticket... (please wait)");
        
        try {
            await App.meta['tigerTicket'].methods.purchase(target).send({ 
                from: App.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });
            await this.updateTicketBalance();
            this.setStatus("Purchase complete for Tiger Ticket!");
        } catch (error) {
            console.error("Purchase of Ticket error:", error);
            this.setStatus("Purchase failed: " + error.message);
        }
    },

    redeemTicket: async function() {
        const target = document.getElementById("targetAddressTicketCashier").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Ticket redemption.");
            return;
        }
        this.setStatus("Initiating token redemption for Ticket... (please wait)");
        try {
            await App.meta['tigerTicket'].methods.redeem(target).send({ 
                from: App.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });
            await this.updateTicketBalance();
            this.setStatus("Redemption complete for Tiger Ticket!");
        } catch (error) {
            console.error("Redemption of Ticket error:", error);
            this.setStatus("Redemption failed: " + error.message);
        }
    },

    purchaseIceCream: async function() {
        const target = document.getElementById("targetAddressIceCreamCashier").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Ice Cream purchase.");
            return;
        }
        this.setStatus("Initiating token purchase for Ice Cream... (please wait)");
        try {
            await App.meta['tigerIceCream'].methods.purchase(target).send({ 
                from: App.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });
            await this.updateIceCreamBalance();
            this.setStatus("Purchase complete for Tiger Ice Cream!");
        } catch (error) {
            console.error("Purchase of Ice Cream error:", error);
            this.setStatus("Purchase failed: " + error.message);
        }
    },

    redeemIceCream: async function() {
        const target = document.getElementById("targetAddressIceCreamCashier").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Ice Cream redemption.");
            return;
        }
        this.setStatus("Initiating token redemption for Ice Cream... (please wait)");
        try {
            await App.meta['tigerIceCream'].methods.redeem(target).send({ 
                from: App.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });
            await this.updateIceCreamBalance();
            this.setStatus("Redemption complete for Tiger Ice Cream!");
        } catch (error) {
            console.error("Redemption of Ice Cream error:", error);
            this.setStatus("Redemption failed: " + error.message);
        }
    },


    refreshReserves: async function() {
        try {
            const reserves = await this.meta['DynamicSwap'].methods.getReserves().call();
            const reserve0Element = document.getElementsByClassName("reservesCoffee");
            const reserve1Element = document.getElementsByClassName("reservesSandwich");
            reserve0Element[0].innerHTML = (Number(reserves[0]) / 1e8).toFixed(8);
            reserve1Element[0].innerHTML = (Number(reserves[1]) / 1e8).toFixed(8);
            reserve0Element[1].innerHTML = (Number(reserves[0]) / 1e8).toFixed(8);
            reserve1Element[1].innerHTML = (Number(reserves[1]) / 1e8).toFixed(8);
        } catch (error) {
            console.error("Error refreshing reserves:", error);
        }
    },

    makeSwap: async function() {
        const token1 = document.getElementById("swap1").value;
        console.log(token1)
        const token2 = document.getElementById("swap2").value;
        const burnAmount = document.getElementById("swapamt").value;
        console.log(burnAmount);


        const tokens = {
            0: "tigerCoffee",
            1: "tigerSandwich",
            2: "tigerTicket", 
            3: "tigerIceCream"
        };

        if (token1 == token2) {
            App.setStatus("Please swap two different tokens.");
            return;
        }
        if (!burnAmount || isNaN(burnAmount)) {
            this.setStatus("Invalid swap amount.");
            return;
        }

        this.setStatus("Swapping... (please wait)");

        const amount1 = (Math.floor(parseFloat(burnAmount) * 1e8)).toString()

        const prices = await this.getPrices();
        const token1price = prices[token1];

        const token2price = prices[token2];

        const mintAmount = burnAmount * token2price / token1price;
        const amount2 = (Math.floor(parseFloat(mintAmount) * 1e8)).toString()
        console.log(mintAmount);


        try {

            await this.meta[tokens[token1]].methods.burn(this.accounts[0], amount1).send({ 
                from: this.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });

            await this.meta[tokens[token2]].methods.mint(this.accounts[0], amount2).send({ 
                from: this.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });

            await this.refreshBalance();
            this.setStatus("Swap complete!");
        } catch (error) {
            console.error("Swap error:", error);
            this.setStatus("Swap failed: " + error.message);
        }
    },
    getHour: async function() {
        const now = new Date();
        console.log(now.getHours());
        return now.getHours();
    },
    getDayofWeek: async function() {
        const now = new Date();
        const day = now.getDay();
        console.log(day);
        // Sunday (0), Monday (1), etc.
        return day;
    },
    getPrincetonWeather: async function() {
        const api = "08ece679ec4f4dbdb31162754250205";
        const url = `https://api.weatherapi.com/v1/current.json?key=${api}&q=Princeton`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch weather");
            const data = await response.json();
            console.log(data.current.temp_f);
            return data.current.temp_f;
        } catch (error) {
            console.error("Error getting weather:", error);
          }
    },
    getGoogleTrends: async function(keyword) {
        if (!keyword) {
            console.error("Keyword is required!");
            return;
          }
        
          const url = `http://localhost:3000/api/trends?keyword=${encodeURIComponent(keyword)}`;
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error("Failed to fetch trends");
          const data = await response.json();
          const timeline = data.interest_over_time.timeline_data;
          const lastItem = timeline[timeline.length - 1];
          console.log(lastItem.values[0].extracted_value);
          return lastItem.values[0].extracted_value;
        } catch (error) {
            console.error("Error getting trends data:", error);
          }
    },
    getPrices: async function(){
        App.setStatus("Loading prices...");
        const time = await this.getHour();
        const day = await  this.getDayofWeek();
        const temp = await this.getPrincetonWeather();
        
        const smallworld = await this.getGoogleTrends("small world princeton");
        const olives = await this.getGoogleTrends("olives princeton");
        const theatre = await this.getGoogleTrends("garden theatre princeton");
        const bentspoon = await this.getGoogleTrends("bent spoon princeton");

        const d_coffee = Math.random() * (0.7 - 0.5) + 0.5;
        const d_sandwich = Math.random() * (0.7 - 0.5) + 0.5;
        const d_ticket = Math.random() * (0.7 - 0.5) + 0.5;
        const d_icecream = Math.random() * (0.7 - 0.5) + 0.5;

        const coffeePrice = await this.getCoffeePrice(time, day, temp, smallworld, d_coffee, 0.436);
        const sandwichPrice = await this.getSandwichPrice(time, day, temp, olives, d_sandwich, 0.727);
        const ticketPrice = await this.getTicketPrice(time, day, temp, theatre, d_ticket, 1);
        const iceCreamPrice = await this.getIceCreamPrice(time, day, temp, bentspoon, d_icecream, 0.585);

        console.log(coffeePrice);
        console.log(sandwichPrice);
        console.log(ticketPrice);
        console.log(iceCreamPrice);

        const coffee = document.getElementsByClassName("priceCoffee");
        coffee[0].innerHTML = ((coffeePrice)).toFixed(8);
        const sandwich = document.getElementsByClassName("priceSandwich");
        sandwich[0].innerHTML = ((sandwichPrice)).toFixed(8);
        const ticket = document.getElementsByClassName("priceTicket");
        ticket[0].innerHTML = ((ticketPrice)).toFixed(8);
        const icecream = document.getElementsByClassName("priceIceCream");
        icecream[0].innerHTML = ((iceCreamPrice)).toFixed(8);
        
        return [coffeePrice, sandwichPrice, ticketPrice, iceCreamPrice];
    },

    getCoffeePrice: async function(time, day, temp, google, activity, cost){
        let timeScore = 0;
        if (time >= 5 && time < 7) {
            timeScore = (time - 5) / (7 - 5);
        } else if (time >= 7 && time <= 13) {
            timeScore = 1;
        } else if (time > 13 && time <= 18) {
            timeScore = (18 - hour) / (18-13);
        }

        const dayWeights = {
            0: 0.4,
            1: 1.0,
            2: 0.9, 
            3: 0.8,
            4: 0.7,
            5: 0.7,
            6: 0.4
        };
        const dayScore = dayWeights[day];

        let tempScore = 0;
        if (temp < 40) {
            tempScore = (temp - 0) / (40);
        } else if (temp <=65) {
            tempScore = 1
        } else if (temp <= 90) {
            tempScore = (90 - temp)/(90-65);
        }
        const googleScore = google / 100;

        return (timeScore + dayScore + tempScore + googleScore + cost + activity);
    },

    getSandwichPrice: async function(time, day, temp, google, activity, cost){
        let timeScore = 0;
        if (time >= 5 && time < 7) {
            timeScore = (time - 5) / (7 - 5);
        } else if (time >= 7 && time <= 15) {
            timeScore = 1;
        } else if (time > 15 && time <= 18) {
            timeScore = (18 - hour) / (18-15);
        }

        const dayWeights = {
            0: 0.7,
            1: 0.7,
            2: 0.7, 
            3: 0.8,
            4: 0.9,
            5: 0.9,
            6: 0.7
        };
        const dayScore = dayWeights[day];

        let tempScore = 0;
        if (temp < 60) {
            tempScore = (temp) / (60);
        } else if (temp <=80) {
            tempScore = 1
        } else if (temp <= 90) {
            tempScore = (90 - temp)/(90-80);
        }
        const googleScore = google / 100;

        return (timeScore + dayScore + tempScore + googleScore + cost + activity);
    },

    getTicketPrice: async function(time, day, temp, google, activity, cost){
        let timeScore = 0;
        if (time >= 9 && time < 18) {
            timeScore = (time - 9) / (18 - 9);
        } else if (time >= 18 && time <= 23) {
            timeScore = 1;
        }

        const dayWeights = {
            0: 1.0,
            1: 0.2,
            2: 0.2, 
            3: 0.4,
            4: 0.8,
            5: 0.9,
            6: 1.0
        };
        const dayScore = dayWeights[day];

        let tempScore = 0;
        if (temp < 40) {
            tempScore = (temp - 0) / (40);
        } else if (temp <=65) {
            tempScore = 1
        } else if (temp <= 90) {
            tempScore = (90 - temp) / (90-65);
        }

        const googleScore = google / 100;

        return (timeScore + dayScore + tempScore + googleScore + cost + activity);
    },

    getIceCreamPrice: async function(time, day, temp, google, activity, cost){
        let timeScore = 0;
        if (time >= 9 && time < 16) {
            timeScore = (time - 9) / (16 - 9);
        } else if (time >= 16 && time <= 21) {
            timeScore = 1;
        } else if (time > 21 && time <= 23) {
            timeScore = (23 - hour) / (23-21);
        }

        const dayWeights = {
            0: 1.0,
            1: 0.2,
            2: 0.2, 
            3: 0.4,
            4: 0.6,
            5: 0.9,
            6: 1.0
        };
        const dayScore = dayWeights[day];

        const tempScore = Math.min(Math.max(temp/90, 0), 1);

        const googleScore = google / 100;

        return (timeScore + dayScore + tempScore + googleScore + cost + activity);
    },

    setStatus: function(message) {
        const status = document.getElementById("status");
        status.innerHTML = message;
        const status2 = document.getElementById("status2");
        status2.innerHTML = message;
    },

    // PASSPORT FUNCTIONS

    updateCoffeePassport: async function() {
        setTimeout(async () => {
          try {
            const progress = await App.refCoffee();
            console.log("Coffee progress:", progress);
      
            const totalRewards = Math.floor(progress / 10);
            const progressToNext = progress % 10;
      
            document.getElementById("coffee-status").innerText =
              `You've earned ${totalRewards} reward${totalRewards !== 1 ? 's' : ''}, and you're ${(progressToNext).toFixed(2)}/10 toward your next one.`;
      
            const container = document.getElementById("coffee-stamps");
      
            container.innerHTML = '';
      
            for (let i = 0; i < 10; i++) {
              const stamp = document.createElement("div");
              stamp.classList.add("stamp");
              stamp.textContent = "\u2615"; // ☕️
              if (i < Math.floor(progressToNext)) {
                stamp.classList.add("filled");
              }
              container.appendChild(stamp);
            }
          } catch (err) {
            console.error("Error updating coffee passport:", err);
          }
        }, 500); // delay to ensure data is ready — adjust if needed
      },

    updateSandwichPassport: async function() {
        setTimeout(async () => {
          try {
            const progress = await App.refSandwich();
            console.log("Sandwich progress:", progress);
      
            const totalRewards = Math.floor(progress / 10);
            const progressToNext = progress % 10;
      
            document.getElementById("sandwich-status").innerText =
              `You've earned ${totalRewards} reward${totalRewards !== 1 ? 's' : ''}, and you're ${(progressToNext).toFixed(2)}/10 toward your next one.`;
      
            const container = document.getElementById("sandwich-stamps");
      
            container.innerHTML = '';
      
            for (let i = 0; i < 10; i++) {
              const stamp = document.createElement("div");
              stamp.classList.add("stamp");
              stamp.textContent = "\uD83E\uDD6A";
              if (i < Math.floor(progressToNext)) {
                stamp.classList.add("filled");
              }
              container.appendChild(stamp);
            }
          } catch (err) {
            console.error("Error updating sandwich passport:", err);
          }
        }, 500); // delay to ensure data is ready — adjust if needed
      },

      updateTicketPassport: async function() {
        setTimeout(async () => {
          try {
            const progress = await App.refTicket();
            console.log("Ticket progress:", progress);
      
            const totalRewards = Math.floor(progress / 10);
            const progressToNext = progress % 10;
      
            document.getElementById("ticket-status").innerText =
              `You've earned ${totalRewards} reward${totalRewards !== 1 ? 's' : ''}, and you're ${(progressToNext).toFixed(2)}/10 toward your next one.`;
      
            const container = document.getElementById("ticket-stamps");
      
            container.innerHTML = '';
      
            for (let i = 0; i < 10; i++) {
              const stamp = document.createElement("div");
              stamp.classList.add("stamp");
              stamp.textContent = "\uD83C\uDFAB";
              if (i < Math.floor(progressToNext)) {
                stamp.classList.add("filled");
              }
              container.appendChild(stamp);
            }
          } catch (err) {
            console.error("Error updating ticket passport:", err);
          }
        }, 500); // delay to ensure data is ready — adjust if needed
      },

    updateIceCreamPassport: async function() {
        setTimeout(async () => {
          try {
            const progress = await App.refIceCream();
            console.log("Ice Cream progress:", progress);
      
            const totalRewards = Math.floor(progress / 10);
            const progressToNext = progress % 10;
      
            document.getElementById("icecream-status").innerText =
              `You've earned ${totalRewards} reward${totalRewards !== 1 ? 's' : ''}, and you're ${(progressToNext).toFixed(2)}/10 toward your next one.`;
      
            const container = document.getElementById("icecream-stamps");
      
            container.innerHTML = '';
      
            for (let i = 0; i < 10; i++) {
              const stamp = document.createElement("div");
              stamp.classList.add("stamp");
              stamp.textContent = "\uD83C\uDF66";
              if (i < Math.floor(progressToNext)) {
                stamp.classList.add("filled");
              }
              container.appendChild(stamp);
            }
          } catch (err) {
            console.error("Error updating ice cream passport:", err);
          }
        }, 500); // delay to ensure data is ready — adjust if needed
      },

      // NFT FUNCTIONS

      mintNFT: async function() {
        this.setStatus("Minting NFT... (please wait)");
        try {
            const targetAddress = document.getElementById("nftTargetAddress").value.trim();
            const nftEvent = document.getElementById("nftEvent").value;
            const nftAmount = document.getElementById("nftAmount").value;
            if (!targetAddress || !nftEvent || !nftAmount || isNaN(nftAmount)) {
                this.setStatus("Invalid NFT minting input");
                return;
            }
            await this.meta["NFTsInTown"].methods.mintNFT(targetAddress, nftEvent, nftAmount, "0x").send({
                from: this.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });            
            this.setStatus("NFT minted successfully");
        } catch (error) {
            console.error("Error minting NFT:", error);
            this.setStatus("Error minting NFT: " + error.message);
        }
    },
    updateNFTPassport: async function() {
        const target = document.getElementById("targetAddressPassport").value.trim();
        if (target === "") {
            App.setStatus("Please enter customer address for Passport");
            return;
        }
        try {
            let nftDisplay = "";
            // Add an image URL for each event.
            // Replace the links below with your actual Pinata (or other hosted) URLs.
            const events = [
                {
                    id: 0, 
                    name: "Small World Seasonal Drink", 
                    image: "https://ipfs.io/ipfs/bafybeihc6ofiqm5656ovskfduolez7nxdrmdor5d7dvnd6qsixa4pklhpy"
                },
                {
                    id: 1, 
                    name: "Garden Theatre Movie Premier", 
                    image: "https://ipfs.io/ipfs/bafybeicqisz6bl6ckvgvyfaivnlumtc2ib5eqcyr5hwdzzxnhgsdtqfg3m"
                },
                {
                    id: 2, 
                    name: "Olives Christmas Sandwich Special", 
                    image: "https://ipfs.io/ipfs/bafybeieio2kkulwo5lvngkmotfxlkph2bnndenvogdd6abcrixun7vrvly"
                },
                {
                    id: 3, 
                    name: "Bent Spoon Flavour of the Week", 
                    image: "https://ipfs.io/ipfs/bafybeierbidntmol37jekyr4brgqenisltakodi6mymnhgywf37arnl5di"
                }
            ];
            for (let event of events) {
                // Get the NFT balance for the connected account for this event.
                const balance = await this.meta["NFTsInTown"].methods.balanceOf(target, event.id).call();
                nftDisplay += `<div class="card">
                                 <h3>${event.name}</h3>
                                 <img src="${event.image}" alt="${event.name}" style="width:100px;height:auto;" />
                                 <p>Balance: ${balance}</p>
                               </div>`;
            }
            document.getElementById("nft-passport").innerHTML = nftDisplay;
        } catch (error) {
            console.error("Error updating NFT passport:", error);
            this.setStatus("Error retrieving NFT collection: " + error.message);
        }
    },   

    // ADMIN FUNCTIONS 
    init: async function() {
        this.setStatus("Initiating liquidity transaction... (please wait)");
        try {
            const liquidity0Input = document.getElementById("liquidity0").value;
            const liquidity1Input = document.getElementById("liquidity1").value;
            if (!liquidity0Input || !liquidity1Input || isNaN(liquidity0Input) || isNaN(liquidity1Input)) {
                this.setStatus("Invalid liquidity input");
                return;
            }
            const liquidity0 = (parseFloat(liquidity0Input) * 1e8).toString();
            const liquidity1 = (parseFloat(liquidity1Input) * 1e8).toString();

            await this.meta['DynamicSwap'].methods.init(liquidity0, liquidity1).send({
                from: this.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });
            await this.refreshBalance();
            this.setStatus("Liquidity initialization complete!");
        } catch (error) {
            console.error("Error in init:", error);
            this.setStatus("Liquidity initialization failed: " + error.message);
        }
    },

    mintCoffee: async function() {
        this.setStatus("Initiating mint for Tiger Coffee... (please wait)");
        try {
            const mintInput = document.getElementById("mint0").value;
            if (!mintInput || isNaN(mintInput)) {
                this.setStatus("Invalid mint amount for Coffee");
                return;
            }
            const amount0 = (parseFloat(mintInput) * 1e8).toString();
            await this.meta['tigerCoffee'].methods.mint(this.accounts[0], amount0).send({ 
                from: this.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });
            await this.refreshBalance();
            this.setStatus("Mint complete for Tiger Coffee!");
        } catch (error) {
            console.error("Mint Coffee error:", error);
            this.setStatus("Mint failed: " + error.message);
        }
    },

    burnCoffee: async function() {
        this.setStatus("Initiating burn for Tiger Coffee... (please wait)");
        try {
            const burnInput = document.getElementById("burn0").value;
            if (!burnInput || isNaN(burnInput)) {
                this.setStatus("Invalid burn amount for Coffee");
                return;
            }
            const amount0 = (parseFloat(burnInput) * 1e8).toString();
            await this.meta['tigerCoffee'].methods.burn(this.accounts[0], amount0).send({ 
                from: this.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });
            await this.refreshBalance();
            this.setStatus("Burn complete for Tiger Coffee!");
        } catch (error) {
            console.error("Burn Coffee error:", error);
            this.setStatus("Burn failed: " + error.message);
        }
    },

    mintSandwich: async function() {
        this.setStatus("Initiating mint for Tiger Sandwich... (please wait)");
        try {
            const mintInput = document.getElementById("mint1").value;
            if (!mintInput || isNaN(mintInput)) {
                this.setStatus("Invalid mint amount for Sandwich");
                return;
            }
            const amount1 = (parseFloat(mintInput) * 1e8).toString();
            await this.meta['tigerSandwich'].methods.mint(this.accounts[0], amount1).send({
                from: this.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });
            await this.refreshBalance();
            this.setStatus("Mint complete for Tiger Sandwich!");
        } catch (error) {
            console.error("Mint Sandwich error:", error);
            this.setStatus("Mint failed: " + error.message);
        }
    },

    burnSandwich: async function() {
        this.setStatus("Initiating burn for Tiger Sandwich... (please wait)");
        try {
            const burnInput = document.getElementById("burn1").value;
            if (!burnInput || isNaN(burnInput)) {
                this.setStatus("Invalid burn amount for Sandwich");
                return;
            }
            const amount1 = (parseFloat(burnInput) * 1e8).toString();
            await this.meta['tigerSandwich'].methods.burn(this.accounts[0], amount1).send({
                from: this.accounts[0],
                gasPrice: '20000000000',
                gas: '3000000'
            });
            await this.refreshBalance();
            this.setStatus("Burn complete for Tiger Sandwich!");
        } catch (error) {
            console.error("Burn Sandwich error:", error);
            this.setStatus("Burn failed: " + error.message);
        }
    },
    initVotesDisplay: function() {
        const user = this.accounts[0];
        this.smallWorldVotes = JSON.parse(localStorage.getItem('smallWorldVotes') || '[0,0,0]');
        this.gardenVotes    = JSON.parse(localStorage.getItem('gardenVotes')    || '[0,0,0]');
        this.swVoted = localStorage.getItem(`swVoted-${user}`) === 'true';
        this.gtVoted = localStorage.getItem(`gtVoted-${user}`) === 'true';
        this.renderVoteCounts();
    },

    renderVoteCounts: function() {
        this.smallWorldVotes.forEach((c,i) => {
            document.getElementById(`sw-votes-${i}`).innerText = c;
        });
        this.gardenVotes.forEach((c,i) => {
            document.getElementById(`gt-votes-${i}`).innerText = c;
        });
    },

    voteSmallWorldDrink: async function(option) {
        const user = this.accounts[0];
        const bal = await this.meta['NFTsInTown'].methods.balanceOf(user, 0).call();
        if (Number(bal) < 10) {
            return document.getElementById('smallworld-vote-status').innerText =
                'You need at least 10 Small World NFTs to vote';
        }
        if (this.swVoted) {
            return document.getElementById('smallworld-vote-status').innerText =
                'You have already voted';
        }
        this.smallWorldVotes[option]++;
        this.swVoted = true;
        localStorage.setItem('smallWorldVotes', JSON.stringify(this.smallWorldVotes));
        localStorage.setItem(`swVoted-${user}`, 'true');
        this.renderVoteCounts();
        document.getElementById('smallworld-vote-status').innerText = 'Vote recorded!';
    },

    voteGardenMovie: async function(option) {
        const user = this.accounts[0];
        const bal = await this.meta['NFTsInTown'].methods.balanceOf(user, 1).call();
        if (Number(bal) < 10) {
            return document.getElementById('garden-vote-status').innerText =
                'You need at least 10 Garden Theatre NFTs to vote';
        }
        if (this.gtVoted) {
            return document.getElementById('garden-vote-status').innerText =
                'You have already voted';
        }
        this.gardenVotes[option]++;
        this.gtVoted = true;
        localStorage.setItem('gardenVotes', JSON.stringify(this.gardenVotes));
        localStorage.setItem(`gtVoted-${user}`, 'true');
        this.renderVoteCounts();
        document.getElementById('garden-vote-status').innerText = 'Vote recorded!';
    }
};

window.App = App;

window.addEventListener("load", function() {
    if (window.ethereum) {
        // Use MetaMask's provider
        App.web3 = new Web3(window.ethereum);
        window.ethereum.request({ method: 'eth_requestAccounts' });
    } else {
        console.warn("No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live");
        App.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
    }
    App.start();
});