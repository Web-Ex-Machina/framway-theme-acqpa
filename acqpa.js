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
	if(!form.valid){
		return new Promise(function (resolve, reject) {
			reject('Veuillez remplir le formulaire');
		});
	}
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

utils.registration.refreshRegistrationOperatorExamLevels = function refreshRegistrationOperatorExamLevels(level, previouslySelectedSession){
	$('.registration_session option').remove();

	utils.registration.getRegistrationOperatorExamSessionByLevel(level, previouslySelectedSession)
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			notif_fade.success(r.msg);
			$('.registration_session').append(r.html);
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
utils.registration.getRegistrationOperatorExamSessionByLevel = function getRegistrationOperatorExamSessionByLevel(level, previouslySelectedSession){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'getExamSessionByLevel',
		'level': level,
		'previouslySelectedSession': previouslySelectedSession,
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
	if(!form.valid){
		return new Promise(function (resolve, reject) {
			reject('Veuillez remplir le formulaire');
		});
	}
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'saveRegistrationOperator',
	};

	var data = {};
	for (var i in form.inputs) {
		objFields[form.inputs[i].name] = form.inputs[i].value;
	}
	
	// retrieve uploaded files if any 
	// and add them to objFields 
	// additionnal AJAX options to provide :  {contentType: false,processData: false}
	if("undefined" != typeof $('input[data-name="operator[identity_picture]"]').attr('required')
	&& 0 === $('input[name="operator[identity_picture]"]').length
	){
		return new Promise(function (resolve, reject) {
			reject('La photo d\'identit?? n\'a pas ??t?? fournie');
		});
	}
	if(0 !== $('input[name="operator[identity_picture]"]').length){
		objFields['operator[identity_picture]'] = $('input[name="operator[identity_picture]"]')[0].value;
	}

	if("undefined" != typeof $('input[data-name="operator[identity_piece]"]').attr('required')
	&& 0 === $('input[name="operator[identity_piece]"]').length
	){
		return new Promise(function (resolve, reject) {
			reject('La pi??ce d\'identit?? n\'a pas ??t?? fournie');
		});
	}
	if(0 !== $('input[name="operator[identity_piece]"]').length){
		objFields['operator[identity_piece]'] = $('input[name="operator[identity_piece]"]')[0].value;
	}

	if("undefined" != typeof $('input[data-name="operator[cv]"]').attr('required')
	&& 0 === $('input[name="operator[cv]"]').length
	){
		return new Promise(function (resolve, reject) {
			reject('Le certificat employeur n\'a pas ??t?? fourni');
		});
	}
	if(0 !== $('input[name="operator[cv]"]').length){
		objFields['operator[cv]'] = $('input[name="operator[cv]"]')[0].value;
	}

	if("undefined" != typeof $('input[data-name="registration[employer_certificate]"]').attr('required')
	&& 0 === $('input[name="registration[employer_certificate]"]').length
	){
		return new Promise(function (resolve, reject) {
			reject('Le certificat employeur n\'a pas ??t?? fourni');
		});
	}
	if(0 !== $('input[name="registration[employer_certificate]"]').length){
		objFields['registration[employer_certificate]'] = $('input[name="registration[employer_certificate]"]')[0].value;
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

/** SESSION **/
utils.session = {};
utils.session.refreshSessionTranslators = function refreshSessionTranslators(){
	$('.translators .table-list__line').remove();

	utils.session.getSessionTranslators()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			notif_fade.success(r.msg);
			$('.translators .table-list__container').append(r.html);
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
utils.session.getSessionTranslators = function getSessionTranslators(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getTranslators',
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
utils.session.saveExamSessionTranslator = function saveExamSessionTranslator(modal){
	var form = utils.checkForm(modal);
	if(!form.valid){
		return new Promise(function (resolve, reject) {
			reject('Veuillez remplir le formulaire');
		});
	}
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'saveExamSessionTranslator',
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
utils.session.refreshSessionExaminers = function refreshSessionExaminers(){
	$('.examiners .table-list__line').remove();

	utils.session.getSessionExaminers()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			notif_fade.success(r.msg);
			$('.examiners .table-list__container').append(r.html);
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
utils.session.getSessionExaminers = function getSessionExaminers(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getExaminers',
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
utils.session.saveExamSessionExaminer = function saveExamSessionExaminer(modal){
	var form = utils.checkForm(modal);
	if(!form.valid){
		return new Promise(function (resolve, reject) {
			reject('Veuillez remplir le formulaire');
		});
	}
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'saveExamSessionExaminer',
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
utils.session.refreshSessionOperators = function refreshSessionOperators(){
	$('.operators .table-list__line').remove();

	utils.session.getRegistrationOperators()
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
utils.session.getRegistrationOperators = function getRegistrationOperators(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
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
    notif_fade.error("Vous avez ??t?? d??connect??, la page va se rafraichir et vous devrez vous reconnecter.");
    setTimeout(function(){ location.reload(); }, 3000);
  }
  else {	
    notif.error("Erreur : " + textStatus);
  }
}

utils.formatDate = function(date, format){
	return format
    .replace('d',date.getDate() < 10 ? "0" + date.getDate() : date.getDate())
    .replace('m',date.getMonth()+1 < 10 ? "0" + (date.getMonth()+1) : date.getMonth()+1)
    .replace('Y',date.getFullYear())
    .replace('H',date.getHours() < 10 ? "0" + date.getHours() : date.getHours())
    .replace('i',date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes())
  ;
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
			if('registration' === args.source){
				utils.registration.refreshRegistrationOperators();
			}else if('session' === args.source){
				utils.session.refreshSessionOperators();
			}
			modal.destroy();
		},
	});
	modal.open();
}
utils.callbacks.refreshRegistrationOperators = function refreshRegistrationOperators() {
	utils.registration.refreshRegistrationOperators();
}
utils.callbacks.refreshSessionOperators = function refreshSessionOperators() {
	utils.session.refreshSessionOperators();
}
utils.callbacks.refreshSessionTranslators = function refreshSessionTranslators() {
	utils.session.refreshSessionTranslators();
}
utils.callbacks.refreshSessionExaminers = function refreshSessionExaminers() {
	utils.session.refreshSessionExaminers();
}

utils.callbacks.openSessionTranslatorModal = function openSessionTranslatorModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		onOpen: () => {
			// $('.registration_exam_level').trigger('change');
		},
		onClose: () => {
			utils.session.refreshSessionTranslators();
			modal.destroy();
		},
	});
	modal.open();
}

utils.callbacks.openSessionExaminerModal = function openSessionExaminerModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		onOpen: () => {
			// $('.registration_exam_level').trigger('change');
		},
		onClose: () => {
			utils.session.refreshSessionExaminers();
			modal.destroy();
		},
	});
	modal.open();
}