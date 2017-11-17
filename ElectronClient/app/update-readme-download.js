'use strict';

const fs = require('fs-extra');
const https = require('https');
const request = require('request');

const url = 'https://api.github.com/repos/laurent22/joplin/releases/latest';
const readmePath = __dirname + '/../../README.md';

async function gitHubLatestRelease() {
	return new Promise((resolve, reject) => {
		request.get({
			url: url,
			json: true,
			headers: {'User-Agent': 'Joplin Readme Updater'}
		}, (error, response, data) => {
			if (error) {
				reject(error);
			} else if (response.statusCode !== 200) {
				reject(new Error('Error HTTP ' + response.statusCode));
			} else {
				resolve(data);
			}
		});
	});
}

function downloadUrl(release, os) {
	if (!release || !release.assets || !release.assets.length) return null;

	for (let i = 0; i < release.assets.length; i++) {
		const asset = release.assets[i];
		const name = asset.name;

		if (name.indexOf('.dmg') > 0 && os === 'macos') return asset.browser_download_url; 
		if (name.indexOf('.exe') > 0 && os === 'windows') return asset.browser_download_url; 
		if (name.indexOf('.AppImage') > 0 && os === 'linux') return asset.browser_download_url; 
	}
}

function readmeContent() {
	if (!fs.existsSync(readmePath)) throw new Error('Cannot find ' + readmePath);
	return fs.readFileSync(readmePath, 'utf8');
}

function setReadmeContent(content) {
	if (!fs.existsSync(readmePath)) throw new Error('Cannot find ' + readmePath);
	return fs.writeFileSync(readmePath, content);
}

async function main() {
	const release = await gitHubLatestRelease();

	const winUrl = downloadUrl(release, 'windows');
	const macOsUrl = downloadUrl(release, 'macos');
	const linuxUrl = downloadUrl(release, 'linux');

	let content = readmeContent();

	if (winUrl) content = content.replace(/(\(https:\/\/github.com\/laurent22\/joplin\/releases\/download\/.*?\.exe\))/, '(' + winUrl + ')');
	if (macOsUrl) content = content.replace(/(\(https:\/\/github.com\/laurent22\/joplin\/releases\/download\/.*?\.dmg\))/, '(' + macOsUrl + ')');
	if (linuxUrl) content = content.replace(/(\(https:\/\/github.com\/laurent22\/joplin\/releases\/download\/.*?\.AppImage\))/, '(' + linuxUrl + ')');

	setReadmeContent(content);
}

main().catch((error) => {
	console.error('Fatal error', error);
});