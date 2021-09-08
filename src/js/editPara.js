//add edit button
var parentEl = document.getElementById('paragraphForm');
var btn = document.createElement('button');
btn.className = 'secondaryButton';
btn.id = 'paraEditButton';
btn.textContent = 'edit';
btn.style = 'margin:20px 20px 0px 20px'
btn.onclick = beginParaEdit;
parentEl.insertBefore(btn, parentEl.childNodes[0]);

//add save button (and hide it)
btn2 = document.createElement('button');
btn2.className = 'secondaryButton';
btn2.id = 'paraSaveButton';
btn2.textContent = 'save';
btn2.style = 'margin:20px 20px 0px 20px; display:none'
btn2.onclick = saveParaEdit;
parentEl.insertBefore(btn2, parentEl.childNodes[0]);

function beginParaEdit(){
	console.log('editing paragraph');

	//reset the URL
	resetURLdata();

	//change button to save
	d3.select('#paraEditButton').style('display','none');
	d3.select('#paraSaveButton').style('display','block');

	//populate the editor
	var txtarea = d3.select('#paraTextEditor').select('textarea');
	txtarea.style('height',d3.select('#paraText').node().getBoundingClientRect().height);
	txtarea.node().value = params.paraTextSave;


	//hide the current paragraph and show the editor
	d3.select('#paraText').style('display','none');
	d3.select('#paraTextEditor').style('display','block');


}

function saveParaEdit(){
	console.log('saving paragraph');

	//change button to save
	d3.select('#paraEditButton').style('display','block');
	d3.select('#paraSaveButton').style('display','none');

	//populate the paragraph
	var newText = d3.select('#paraTextEditor').select('textarea').node().value;
	console.log('have new text:',newText);
	d3.select('#paraText').html(newText);

	//now convert the paragraph to html markup (this also updates params.paraTextSave)
	convertPara();

	//update the selection words list
	getSelectionWords();

	//define the dropdowns
	createDropdowns();

	//how will we deal with the answers?

	//hide the editor and show the current paragraph
	d3.select('#paraText').style('display','block');
	d3.select('#paraTextEditor').style('display','none');
}

