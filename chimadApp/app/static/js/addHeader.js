// I am pulling this code from html, so I will simply add it as a string, rather than coding it in javascript

document.getElementById('login').innerHTML = "\
	<div class='modal-content animate'>\
		<div class='closeX' onclick='closeGroupnameInput()'>X</div>\
		<p style='font-size:4vw; text-align:center'>Welcome to the CHiMaD System Design Toolbox.  Please login below.</p>\
		<br>\
		<label for='groupnameInput'>Enter your group name (Required). <span id='groupnameNotification' class='notifications error' style='visibility:hidden'>Please enter a valid group name.</span></label>\
		<input type='text' id='groupnameInput' class='fullWidthInput' placeholder='group name' name='groupname' required>\
		<p style='font-size:1.5vw'><i>If you would like to create a new groupname please email Aaron Geller : a-geller [at] northwestern.edu .</i></p>\
		<br/>\
		<p>Please enter the following optional information to help us gather usage statistics.</p>\
		<label class='loginLabel' for='metricNameInput'>Enter your name (Optional).</label>\
		<input type='text' id='metricNameInput' class='fullWidthInput' placeholder='name' name='metricName'>\
		<label class='loginLabel' for='metricOrgInput'>Enter your organization or university (Optional).</label>\
		<input type='text' id='metricOrgInput' class='fullWidthInput' placeholder='organization or university' name='metricOrg'>\
		<label class='loginLabel' for='metricEmailInput'>Enter your email address (to join our listserv) (Optional).</label>\
		<input type='text' id='metricEmailInput' class='fullWidthInput' placeholder='email' name='metricEmail'>\
		<label class='loginLabel' for='metricReason'>How are you planning to use this tool (Optional)?</label>\
		<select name='metricPurpose' id='metricPurposeSelect'>\
			<option value='none' disabled selected>Select one</option>\
			<option value='class'>With my class</option>\
			<option value='company'>With my company</option>\
			<option value='individual'>Individual use</option>\
			<option value='other'>Other</option>\
		</select>\
		<button id='groupnameSubmit' class='button' style='font-size: 2vw; width:100%; margin-top:60px' type='submit' onclick='login()'>Login</button>\
	</div>\
"

document.getElementById('branding').innerHTML = "\
	<div style='padding:0.1vw' id='brandingContainer'>\
		<img id='CHiMaDLogo' src='static/images/ChiMaD_Final_wname-transparent.png' style='width:60vw'>\
		<div id='groupnameDiv' class='landing-button' style='border-width:2px; padding:4px;' onclick='changeGroupname()'><img src='static/images/abstract-user-flat-1.png' style='height:20px;'><span style='margin-left: 6px' id='groupnameID'>click to login</span></div>\
		<div id='hamburger' onclick='toggleDropdown(\"dropdown\")'>\
			<div></div>\
			<div></div>\
			<div></div>\
		</div>\
		<div id='dropdown' style='visibility:hidden'>\
			<a class='simpleLink simpleLinkHover 'style='cursor:pointer' onclick='toHome()'><div style='border:none'>Home</div></a>\
			<a class='simpleLink simpleLinkHover' style='cursor:pointer' onclick='toAbout()'><div>About</div></a>\
			<a class='simpleLink simpleLinkHover' style='cursor:pointer' onclick='toDocs()'><div>Getting Started</div></a>\
			<a class='simpleLink simpleLinkHover' style='cursor:pointer' onclick='toCollaborate()'><div>Collaborate</div></a>\
			<a class='simpleLink simpleLinkHover' style='cursor:pointer' onclick='toIndividual()'><div>Individual</div></a>\
			<a class='simpleLink simpleLinkHover' style='cursor:pointer' onclick='toCustomize()'><div>Customize</div></a>\
			<a class='simpleLink simpleLinkHover' style='cursor:pointer' onclick='logout()'><div>Logout</div></a>\
			<a href='https://chimad.northwestern.edu/' class='simpleLink simpleLinkHover'><div>CHiMaD Main Page</div></a>\
		</div>\
		<hr class='simpleLine'>\
		<div style='font-size:4vw; font-weight:bold; padding-left:0.5vw'>CHiMaD System Design Toolbox</div>\
	</div>\
"

