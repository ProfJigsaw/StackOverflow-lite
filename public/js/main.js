var toggle = false;
var ourRequest = new XMLHttpRequest();
ourRequest.open('GET', '/api/v1/user/getuser');
ourRequest.onload = ()=>{
	if (ourRequest.status >= 200 && ourRequest.status < 400){
		user = JSON.parse(ourRequest.responseText);
		[...document.querySelectorAll(".secret-userId")].map(node=>{
			node.value = user.userId;
		});
		[...document.querySelectorAll(".secret-username")].map(node=>{
			node.value = user.username;
		});
	}else{
		console.log('We connected to the server, but we encountered an error.');
	}
};
ourRequest.send();