const express = require('express');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
// Array containing ports to add firewall rules for
const ports = [80,443];

app.use(express.json());

// Function to parse UFW status output and extract rule numbers
function parseUfwStatus(output) {
    const lines = output.split('\n');
    const ruleNumbers = [];
    lines.forEach(line => {
        if (line !== "") {
            const number = line.split('[')[1].split(']')[0].trim();
            ruleNumbers.push(number);
        }
    });
    return ruleNumbers;
}

function addNewRule(ip, email, res) {
    // Array to store promises for each ufw allow command
    const promises = [];

    // Iterate over each port and create a promise for ufw allow command
    for (let i = 0; i < ports.length; i++) {
        const port = ports[i];
        const promise = new Promise((resolve, reject) => {
            setTimeout(() => {
                exec(`sudo ufw allow from ${ip} to any port ${port} comment 'NFM: ${email}'`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error adding firewall rule: ${error.message}`);
                        reject(error);
                        return;
                    }
                    if (stderr) {
                        console.error(`Error adding firewall rule: ${stderr}`);
                        reject(new Error(stderr));
                        return;
                    }
                    console.log("New rule added for port", port);
                    resolve();
                });
            }, i * 1000); // 1 second delay between each rule add
        });
        promises.push(promise);
    }

    // Wait for all promises to resolve
    Promise.all(promises)
        .then(() => {
            console.log("All rules added successfully");
            res.status(200).json({ message: 'Firewall rule updated successfully' });
        })
        .catch(error => {
            console.error("Error adding firewall rules:", error.message);
            res.status(500).json({ error: 'Internal Server Error' });
        });
}

function clearAll(ruleNumbers,res) {
    if (ruleNumbers.length === 0) {
        res.status(200).json({ message: 'All rules deleted' });
        return;
    }
    // Delete existing firewall rule with the given email
    const ruleNumber = ruleNumbers.pop();
    exec(`sudo ufw --force delete ${ruleNumber}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error deleting firewall rule: ${error.message}`);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        if (stderr) {
            console.error(`Error deleting firewall rule: ${stderr}`);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        // Check UFW status again after deleting a rule
        exec(`sudo ufw status numbered | grep 'NFM: '`, (error, stdout, stderr) => {

            if (stderr) {
                console.error(`Error getting firewall status: ${stderr}`);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            const updatedRuleNumbers = parseUfwStatus(stdout);
            clearAll(updatedRuleNumbers,res);
        });
    });
}

function clearAllRules(res) {
    exec(`sudo ufw status numbered | grep 'NFM: '`, (error, stdout, stderr) => {

        if (stderr) {
            console.error(`Error getting firewall status: ${stderr}`);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        // Parse firewall status to get rule numbers
        const ruleNumbers = parseUfwStatus(stdout);
        if (ruleNumbers.length > 0) {
            clearAll(ruleNumbers,res);
        } else {
            res.status(200).json({ message: 'Nothing to clear' });
        }
    });
}

// Function to delete firewall rules recursively until no rules with the specified email are found
function deleteRules(ip, email, res, ruleNumbers) {
    if (ruleNumbers.length === 0) {
        // All rules deleted, add new rule
        addNewRule(ip, email, res);
        return;
    }

    // Delete existing firewall rule with the given email
    const ruleNumber = ruleNumbers.pop();
    exec(`sudo ufw --force delete ${ruleNumber}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error deleting firewall rule: ${error.message}`);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        if (stderr) {
            console.error(`Error deleting firewall rule: ${stderr}`);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        // Check UFW status again after deleting a rule
        exec(`sudo ufw status numbered | grep '${email}'`, (error, stdout, stderr) => {

            if (stderr) {
                console.error(`Error getting firewall status: ${stderr}`);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            const updatedRuleNumbers = parseUfwStatus(stdout);
            deleteRules(ip, email, res, updatedRuleNumbers);
        });
    });
}

// API endpoint to add or remove firewall rules
app.post('/firewall', (req, res) => {
    const { ip, email } = req.body;

    // Get current firewall status
    exec(`sudo ufw status numbered | grep '${email}'`, (error, stdout, stderr) => {

        if (stderr) {
            console.error(`Error getting firewall status: ${stderr}`);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        // Parse firewall status to get rule numbers
        const ruleNumbers = parseUfwStatus(stdout);
        if (ruleNumbers.length > 0) {
            // Delete existing firewall rules with the given email
            deleteRules(ip, email, res, ruleNumbers);
        } else {
            // No existing rules, add new rule directly
            addNewRule(ip, email, res);
        }
    });
});
// API endpoint to add or remove firewall rules
app.delete('/firewall', (req, res) => {
    clearAllRules(res);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
