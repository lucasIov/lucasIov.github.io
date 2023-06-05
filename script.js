window.addEventListener('DOMContentLoaded', () => {
	// const statlink = "http://localhost:8081/st.php"
	// const statlink = "/server/st.php"
	const statlink = "https://www.fjmessgeraete.ch/59d71404-d59e-11eb-b8bc-0242ac130003/Lucas/lucid/st.php"

	/* stat
	statistique are used to see the number of visits on the website,
	they are completely anonymous and do not contain any personal information.
	*/
	function $_GET(param) {
		let vars = {};
		window.location.href.replace(location.hash,'').replace(/[?&]+([^=&]+)=?([^&]*)?/gi,function(m,key,value){vars[decodeURIComponent(key)]=value!==undefined?decodeURIComponent(value):'';});
		if(param)return vars[param]?vars[param]:null;	
		return vars;
	}

	function uuid64b() {return Math.random().toString(36).slice(2, 10);}

	// stat
	let statno = ($_GET('stat') === 'no') || (localStorage.getItem('stat') === 'no');
	let tp = window.location.pathname.split('/')[1] || "";
	let comeFrom = (tp[0] === 'l' && (tp.length <= 5 && tp.length >= 2)) ? tp : null;
	// delete comeFrom on the url
	if (comeFrom !== null) window.history.replaceState(null, null, window.location.href.replace(`/${comeFrom}`, ''));
	let Sinterface = {
		send: (data) => {},
		msg: (data) => {
			let xhr = new XMLHttpRequest();
			xhr.open('POST', statlink+'?msg', true);
			xhr.send(btoa(JSON.stringify(data)));
		},
	};
	let key;
	if (statno) {
		localStorage.setItem('stat', 'no');
		let info = document.createElement('div');
		info.setAttribute('id', 'nostat');
		info.innerHTML = 'no stat';
		document.body.appendChild(info);
	} else {
		let nc = true
		if (localStorage.getItem('stat') === null) key = uuid64b();
		else {
			key = localStorage.getItem('stat');
			nc = false;
		}
		localStorage.setItem('stat', key);
		Sinterface.send = (data) => {
			let xhr = new XMLHttpRequest();
			xhr.open('POST', statlink+'?auth='+key, true);
			xhr.send(btoa(JSON.stringify(data)));
		}
		Sinterface.msg = (data) => {
			let xhr = new XMLHttpRequest();
			xhr.open('POST', statlink+'?auth='+key+'&msg', true);
			xhr.send(btoa(JSON.stringify(data)));
		}
		let d = {}
		if (comeFrom) d.comeFrom = comeFrom;
		if (nc) {d.ev = 'NU';Sinterface.send(d);}
		else {d.ev = 'SO';Sinterface.send(d);}
	}
	window.addEventListener('beforeunload', () => {Sinterface.send({ev:"SC"})});

	function bugReport(msg) {
		// send bug report (json format)
		let xhr = new XMLHttpRequest()
		xhr.open("POST", statlink+"?auth="+key+"&bugreport", true)
		xhr.send(btoa(JSON.stringify({
			"browser": navigator.userAgent, // browser (some features may not work)
			"page": window.location.pathname, // actual page location (now the were the bug is located)
			"online": navigator.onLine, // is online (if not, the bug may be caused by the lack of internet connection)
			"appVersion": navigator.appVersion, // complement of userAgent
			"platform": navigator.platform, // OS (if the bug is only on a specific OS)
			"screen": `${screen.width}x${screen.height}`, // screen resolution (if the bug is only on a specific resolution (phone, tablet, etc.))
			"message": msg,
		})))
	}

	// open page
	document.querySelector('html').setAttribute('page', window.location.hash.replace('#', '') || 'home');
	document.querySelector('div.back').addEventListener('click', () => {window.location.hash = '';})
	window.addEventListener('keyup', (e) => {if (e.key === 'Escape') window.location.hash = '';})
	document.querySelectorAll('div.centerGrid > div').forEach(tab => {
		if (tab.getAttribute('tab') === null) return;
		tab.addEventListener('click', () => {window.location.hash = tab.getAttribute('tab');})
	})
	// change theme
	document.querySelector('div.theme').addEventListener('click', () => {
		let th = document.querySelector('html').getAttribute('theme') === 'dark' ? 'light' : 'dark';
		document.querySelector('html').setAttribute('theme', th);
		localStorage.setItem('theme', th);
	})
	//default theme (dark)
	document.querySelector('html').setAttribute('theme', localStorage.getItem('theme') || 'dark');

	// lang
	document.querySelector('div.lang>svg.en').addEventListener('click', () => setLang('en'));
	document.querySelector('div.lang>svg.fr').addEventListener('click', () => setLang('fr'));
//	document.querySelector('div.lang>svg.it').addEventListener('click', () => setLang('it'));

	// hash
	window.addEventListener('hashchange', () => {
		document.querySelector('html').setAttribute('page', window.location.hash.replace('#', '') || 'home');
		Sinterface.send({ev: 'PO', page: window.location.hash.substr(1) || 'home'});
	})

	// contact
	document.querySelector('contact > button[name="submit"]').addEventListener('click', () => {
		let data = {
			mail: document.querySelector('contact > div > input[name="mail"]').value,
			object: document.querySelector('contact > div > input[name="object"]').value,
			message: document.querySelector('contact > div > textarea[name="message"]').value,
		}
		let error = false;
		if (data.mail.length === 0) {document.querySelector('contact > div > input[name="mail"]').setAttribute('error', 'true'); error=true}
		else document.querySelector('contact > div > input[name="mail"]').removeAttribute('error')
		if (data.object.length === 0) {document.querySelector('contact > div > input[name="object"]').setAttribute('error', 'true'); error=true}
		else document.querySelector('contact > div > input[name="object"]').removeAttribute('error')
		if (data.message.length === 0) {document.querySelector('contact > div > textarea[name="message"]').setAttribute('error', 'true'); error=true}
		else document.querySelector('contact > div > textarea[name="message"]').removeAttribute('error')
		if (!error) {
			Sinterface.msg(data);
			document.querySelector('contact > div > input[name="mail"]').value = '';
			document.querySelector('contact > div > input[name="object"]').value = '';
			document.querySelector('contact > div > textarea[name="message"]').value = '';
		}
	});

	// load creation
	fetch('./creations/data.json').then(res => res.json()).then(creations => {
		document.querySelector('html>body>div.centerGrid>div[tab=\"creation\"]>text').innerHTML = '<galrie></galrie>';
		let load = false;
		function show () {
			if (window.location.hash.replace('#', '') === 'creation' && !load) { // if the page is creation and the creations are not loaded
				load = true;
				for (let i = 0; i < creations.length; i++) {
					let creation = creations[i];
					let div = document.createElement('div');
					/*
					name : name of the creation
					cover : cover image or video url (ex: "jpg" / "png" / "webp" or "mp4" / "webm")
					hover : list of images or videos to display if the mouse is over the creation (close the list if the mouse is out of the creation)
					*/
					let ext = creation.cover.split('.').pop();
					div.innerHTML = (
						["jpg", "png", "webp"].includes(ext) ?
						`<img src="${creation.cover}" alt="${creation.name}">` :
						`<video src="${creation.cover}" alt="${creation.name}" autoplay loop muted playsinline></video>`
					) + `<div class="name">${creation.name || ''}</div>` + `<div class="desc">${creation.description || ''}</div>`;
					div.addEventListener('click', () => {window.open(creation.link || creation.cover, '_blank')});
					document.querySelector('html>body>div.centerGrid>div[tab=\"creation\"]>text>galrie').appendChild(div);
				}
			} else if (window.location.hash.replace('#', '') !== 'creation') { // if the page is not creation stop the videos
				let videos = document.querySelectorAll('html>body>div.centerGrid>div[tab=\"creation\"]>text>galrie>div>video');
				for (let i = 0; i < videos.length; i++) videos[i].pause();
			} else if (load) { // if the creations are loaded play the videos
				let videos = document.querySelectorAll('html>body>div.centerGrid>div[tab=\"creation\"]>text>galrie>div>video');
				for (let i = 0; i < videos.length; i++) videos[i].play();
			}
		}
		if(window.location.hash.replace('#', '') === 'creation') show();
		window.addEventListener('hashchange', show);
	})

	// lang switch
	var langSet = localStorage.getItem('lang') || 'en';
	var langs;
	fetch('/langs.json').then(res => res.json()).then(data => {
		langs = data
		setLang(langSet);
	})

	function setLang(lang) {
		if (lang === undefined) lang = langSet;

		var cv = document.querySelector('html>body>div.centerGrid>div[tab=\"aboutMe\"]>text')
		if (cv.getAttribute("lang") !== lang) fetch('/CV_'+lang+'.html').then(async res =>{
			if (res.status !== 200) {
				cv.innerHTML = `Error: CV is not available in your language (${lang})`;
				let setlang = document.createElement('button');
				setlang.innerHTML = 'load english version';
				setlang.addEventListener('click', () => {setLang('en')});
				cv.appendChild(setlang);
				return false
			}
			return res.text()
		}).then(data => {
			if (data === false) return;
			cv.innerHTML = data
			cv.setAttribute("lang", lang)
		})

		if (langs === undefined) return; // langs not loaded yet
		if (langs.set.includes(lang) === false) lang = 'en'; // lang not supported
		localStorage.setItem('lang', lang);
		document.querySelector('html').setAttribute('lang', lang);
		langSet = lang;
		for (let key in langs.html) document.querySelector(key).innerHTML = langs.html[key][lang] || langs.html[key].en; // set the innerHTML
		for (let key in langs.attr) document.querySelector(key).setAttribute(langs.attr[key].attr, langs.attr[key][lang] || langs.attr[key].en); // set the attributes
		if (Math.random() < 0.1) document.querySelector('html>body>div.centerGrid>div[tab=\"aboutMe\"]>div>span').innerHTML = 'hello world!';
		console.log("set lang to "+lang);
		return lang;
	}
});
