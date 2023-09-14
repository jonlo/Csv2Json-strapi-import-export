import * as fs from 'fs';
import { parse } from 'csv-parse';
import inquirer from 'inquirer';
import dotenv from 'dotenv'

dotenv.config()

let rowsIndex = 0;
let headers = [];
let apiId = null;
let jsonOutput = null;
let selectedAnswer = null;
let csvFileName = null;
inquirer
	.prompt([
		{
			type: 'list',
			name: 'apiId',
			message: process.env.MESSAGE,
			choices: JSON.parse(process.env.CHOICES),
		}
	])
	.then((answers) => {
		apiId = `api::${answers.apiId.toLowerCase()}.${answers.apiId.toLowerCase()}`;
		jsonOutput = `{
			"version": 2,
			"data": {
				"${apiId}": {
		
				}
			}
		}`
		csvFileName = `${answers.apiId}.csv`;
		selectedAnswer = answers.apiId;
		jsonOutput = JSON.parse(jsonOutput);
		semicolonToComma();
	})
	.catch((error) => {
		if (error.isTtyError) {
			// Prompt couldn't be rendered in the current environment
		} else {
			// Something else went wrong
		}
	});


const semicolonToComma = () => {
	fs.readFile(`./${csvFileName}`, 'utf8', (err, data) => {
		if (err) {
			console.error('Error reading the file:', err);
			return;
		}
		const removeCommasData = data.replace(/,/g, '.')
		// Replace commas
		const replacedData = removeCommasData.replace(/;/g, ','); // Replace semicolons with commas

		// Write back to the file
		fs.writeFile(`./tmp_${csvFileName}`, replacedData, 'utf8', (err) => {
			if (err) {
				console.error('Error writing to the file:', err);
				return;
			}

			console.log('File updated successfully!');
			parseCsvToJson();
		});
	});
}


const parseCsvToJson = () => {
	fs.createReadStream(`./tmp_${csvFileName}`)
		.pipe(parse({ delimiter: ",", from_line: 1 }))
		.on("data", (row) => {
			if (rowsIndex === 0) {
				headers = row;
				rowsIndex++;
			} else {
				jsonOutput.data[apiId][`${rowsIndex}`] = {};
				for (let i = 0; i < row.length; i++) {
					jsonOutput.data[apiId][`${rowsIndex}`][`${headers[i]}`] = row[i];
				}
				rowsIndex++;
			}
		})
		.on("end", () => {
			fs.writeFile(`${selectedAnswer}.json`, JSON.stringify(jsonOutput), 'utf8', function (err) {
				if (err) {
					console.log("An error occured while writing JSON Object to File.");
					return console.log(err);
				}

				console.log("JSON file has been saved.");
				removeTmpFile();
			});
		})
		.on("error", (error) => {
			console.log(error.message);
			removeTmpFile();
		});
}

const removeTmpFile = () => {
	fs.unlink(`./tmp_${csvFileName}`, (err) => {
		if (err) {
			console.error(err);
		}
	})
};

