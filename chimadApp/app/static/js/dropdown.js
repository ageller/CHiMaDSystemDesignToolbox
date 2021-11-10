function toggleDropdown(id){
	var drop = document.getElementById(id);

	drop.classList.toggle("active");
	if (drop.style.visibility == "visible" ){
		setTimeout(function(){drop.style.visibility = "hidden";},300);
	} else {
		drop.style.visibility = "visible";
	}

}