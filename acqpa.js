$(function(){
	var form = $('.splitForm.registration').splitForm('get');

	if(form) {
		form.$actions.find('.splitForm__action').off('click');
		form.$actions.find('.splitForm__action').on('click',function() {
			
			// Retrieve the active step
			var activeStep = form.$sections.filter('.active').attr('data-step');

			form.log('action click', this);
			var checkStep = utils.checkForm(form.$sections.filter('.active'),form.renderErrors);

			if($(this).attr('data-dir') != 'prev'){ // action is either next or final
			  if (checkStep.valid === false) {
			    form.$sections.filter('.active').removeClass('complete');
			    form.$wrapper.removeClass('isComplete');
			  } else { 
			    form.$sections.filter('.active').addClass('complete');
			  }
			}

			if($(this).attr('data-dir') != 'final'){ // action is either prev or next
			  utils.registration.saveStep(form.$sections.filter('.active'))
			  	.then(r => {
			  		form.switchStep($(this).attr('data-dir'));
			  		notif_fade[r.status](r.msg);
			  	})
			  	.catch(err => {
			  		notif_fade.error(err);
			  	});
			}
			else if($(this).attr('data-dir') == 'final' && form.$sections.filter('.active').hasClass('complete')){ // action is final, and form is valid
			  if(checkStep.valid){
			  	utils.registration.validateRegistration()
				  	.then(r => {
				  		form.$nav.find('.splitForm__navitem.active').addClass('complete');
				  		form.$wrapper.addClass('isComplete');
				  		var modal = new app.ModalFW({
								name: 'modal--registration--confirm',
								content: r.html,
								width: '1200px',
								onClose: () => {
									modal.destroy();
								},
							});
							modal.open();
				  	})
				  	.catch(err => {
				  		notif_fade.error(err);
				  	});
			  }
			}
	  });

		if (form.enableNav === true) {
      form.$nav.find('.splitForm__navitem').off('click');
      form.$nav.find('.splitForm__navitem').on('click',function(){
			
				// Retrieve the active step
				var activeStep = form.$sections.filter('.active').attr('data-step');
        form.log('nav item click', this)
        
        if (!$(this).hasClass('complete') && !$(this).prev().hasClass('complete'))
          return false;
        
        var posNext = $(this).index() - form.$nav.find('.splitForm__navitem.active').index();
        
        if (posNext < 0) {
          for (var i = 0; i > posNext; i--) {
           	utils.registration.saveStep(form.$sections.filter('.active'))
					  	.then(r => {
					  		form.switchStep('prev');
					  		notif_fade[r.status](r.msg);
					  	})
					  	.catch(err => {
					  		notif_fade.error(err);
					  	});                    
          }
        } else {
          var checkStep = utils.checkForm(form.$sections.filter('.active'),form.renderErrors);
	        if (checkStep.valid === true) {
	          form.$sections.filter('.active').addClass('complete');
	          for (var i = 0; i < posNext; i++) {
	           	utils.registration.saveStep(form.$sections.filter('.active'))
						  	.then(r => {
						  		form.switchStep('next');
						  		notif_fade[r.status](r.msg);
						  	})
						  	.catch(err => {
						  		notif_fade.error(err);
						  	});        
            }
          } else {
            form.$sections.filter('.active').removeClass('complete');
            form.$wrapper.removeClass('isComplete');
          }
        } 
      });
    }
	}

	$('body').on('click','*[data-ajax]',function(e){
	    e.preventDefault();
	    var blnRequest = true;
	    var method = 'POST';
	    var url = '';
	    var action = '';
	    var data = {};
	    var button = $(this);

	    url = button.attr('href');
	    action = button.data('ajax');

	    data['action'] = action;
	    data['REQUEST_TOKEN'] = rt;
	    var strParams = button.data('params');
	    if (strParams) {
	    	var params = strParams.split(",");
	    	for (var i in params) {
	    		var param = params[i].split('=');
	    		data[param[0]] = param[1];
	    	}
	    }

	    button.closest('.table-list__line').addClass('loading');
	    
	    if (action.indexOf('delete') != -1) {
	      blnRequest = confirm('Voulez vous vraiment supprimer ceci ?');
	    }

	    if(blnRequest) {
	      utils.postData(data, url, method).then(function(r){
	        // Display a toastr if there is a status & a msg
	        if (r.status && r.msg) {
	        	notif_fade[r.status](r.msg);
	        }

	        // Apply callbacks
			if('success' === r.status && r.callbacks) {
				for(var i in r.callbacks) {
					// i is the function name in utils
					// r.callbacks[i] is an optional array of arguments
					utils.callbacks[i](r.callbacks[i]);
				}
			}

			button.closest('.table-list__line').removeClass('loading');
	      });
	    } else {
	      button.closest('.table-list__line').removeClass('loading');
	    }
	});
});

/** REGISTRATION **/
utils.registration = {};
utils.registration.saveStep = function saveStep(step){
	var form = utils.checkForm(step);
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'saveRegistration',
	};

	var data = {};
	for (var i in form.inputs) {
		objFields[form.inputs[i].name] = form.inputs[i].value;
	}

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	  .catch(err => {
	    reject(err);
	  });
	});
}
utils.registration.refreshRegistrationOperators = function refreshRegistrationOperators(){
	$('.operators .table-list__line').remove();

	utils.registration.getRegistrationOperators()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			notif_fade.success(r.msg);
			$('.operators .table-list__container').append(r.html);
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
utils.registration.getRegistrationOperators = function getRegistrationOperators(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'getOperators',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	    .catch(err => {
	        reject(err);
	    });
	});
}
utils.registration.getOperatorData = function getOperatorData(id){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'getOperatorData',
		'id': id,
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	    .catch(err => {
	        reject(err);
	    });
	});
}
utils.registration.saveRegistrationOperator = function saveRegistrationOperator(modal){
	var form = utils.checkForm(modal);
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'saveRegistrationOperator',
	};

	var data = {};
	for (var i in form.inputs) {
		objFields[form.inputs[i].name] = form.inputs[i].value;
	}

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	  .catch(err => {
	    reject(err);
	  });
	});
}
utils.registration.validateRegistration = function validateRegistration(modal){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'validateRegistration',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	  .catch(err => {
	    reject(err);
	  });
	});
}
utils.registration.confirmRegistration = function confirmRegistration(modal){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'confirmRegistration',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	  .catch(err => {
	    reject(err);
	  });
	});
}

/** UTILITIES **/
utils.postData = async function postData(data, url = "", method = "POST") {
	var request = new FormData();
	request.append('TL_AJAX', 1);

	for(var i in data) {
		request.append(i, data[i]);
	}

	var strUrl = url ? url : window.location.href;
	var strMethod = method ? method: "POST";

	const response = await fetch(strUrl, {
		method: strMethod,
		mode: 'same-origin',
		cache: 'no-cache',
		body: request
	});

	return response.json();
};

utils.check403 = function(jqXHR, textStatus){
  if("timeout" == textStatus) {
    notif_fade.error("Erreur de communication avec le serveur.");
  }
  else if(jqXHR.status == 403) {
    notif_fade.error("Vous avez été déconnecté, la page va se rafraichir et vous devrez vous reconnecter.");
    setTimeout(function(){ location.reload(); }, 3000);
  }
  else {	
    notif.error("Erreur : " + textStatus);
  }
}

/** CALLBACKS **/
utils.callbacks = {};
utils.callbacks.reload = function reloadPage(wait = 600) {
	setTimeout(() => { window.location.reload(false) }, wait);
}
utils.callbacks.redirect = function redirect(url, wait = 600) {
	setTimeout(() => { window.location.replace(url) }, wait);
}
utils.callbacks.openModal = function openModal(args) {
	var modal = new app.ModalFW(args);
	modal.open();
}
utils.callbacks.openRegistrationOperatorModal = function openRegistrationOperatorModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		onOpen: () => {
			$('.registration_exam_level').trigger('change');
		},
		onClose: () => {
			utils.registration.refreshRegistrationOperators();
			modal.destroy();
		},
	});
	modal.open();
}
utils.callbacks.refreshRegistrationOperators = function refreshRegistrationOperators() {
	utils.registration.refreshRegistrationOperators();
}