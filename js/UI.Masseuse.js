/**
 * Declares instance variables.
 * @param {UI.Loki}	the Loki instance for which this masseuse will massage
 * @constructor
 *
 * @class Represents a body masseuse, to replace elements 
 * inconvenient to edit with fake elements that are convenient 
 * to edit. For extending only.
 */
UI.Masseuse = function(loki)
{
	this.loki = loki;

	/**
	 * Massages the given node's descendants, replacing any elements inconvenient 
	 * to edit with convenient ones.
	 * @param {HTMLElement} an element node in the document being edited in Loki
	 */
	this.massage_node_descendants = function(node)
	{
	};
	
	/**
	 * Unmassages the given node's descendants, replacing any convenient but fake
	 * elements with real ones.
	 * @param {HTMLElement} an element node in the document being edited in Loki
	 */
	this.unmassage_node_descendants = function(node)
	{
	};

	/**
	 * For convenience.
	 */
	this.massage_body = function()
	{
		this.massage_node_descendants(this._loki.document);
	};

	/**
	 * For convenience.
	 */
	this.unmassage_body = function()
	{
		this.unmassage_node_descendants(this._loki.document);
	};
};

// TODO: remove me after legacy code using this init method is gone
UI.Masseuse.prototype.init = function(loki)
{
	this._loki = loki;
	return this;
};
