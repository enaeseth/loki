UI.Multiple_Items_Error = function MultipleItemsError(message) {
	var err = new Error(message);
	err.name = 'UI.Multiple_Items_Error';
	return err;
};

UI.Multiple_Items_Error.prototype = new Error();
