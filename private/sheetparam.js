//the google sheet lives here: https://docs.google.com/spreadsheets/d/1wqex6pmdf8CobXEORdC8S5EN7N70EACVaGAp34SmB2Q/edit?usp=sharing
//the API key below is outdated : https://console.cloud.google.com/ (under Northwestern google login)
//add these back to the params.js file (with the correct API key) for the app to work
        this.googleScriptURL = 'https://script.google.com/macros/s/AKfycbwvec5P2s5E4I0E7Wwy9Ej3a-sqAJFZbJEdzJyRVpSZ_yfaHkYUrMx7TMA5yexSvW0/exec';
        this.sheetID = '1wqex6pmdf8CobXEORdC8S5EN7N70EACVaGAp34SmB2Q';
        this.APIkey = 'AIzaSyDQkhXUUtjzbG61dvodYiIjnr-5JhYdn9s';
        this.surveyFile = 'https://sheets.googleapis.com/v4/spreadsheets/'+this.sheetID+'/values/'+this.groupname+'/?alt=json&callback=readGoogleSheet&key='+this.APIkey;
        this.paragraphFile = 'https://sheets.googleapis.com/v4/spreadsheets/'+this.sheetID+'/values/paragraphs/?alt=json&callback=readGoogleSheetParagraphs&key='+this.APIkey;
        this.sheetRequest = 'https://sheets.googleapis.com/v4/spreadsheets/'+this.sheetID+'/?alt=json&callback=getAvailableSheets&key='+this.APIkey;

