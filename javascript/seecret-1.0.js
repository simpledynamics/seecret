
/**
@author {@link http://www.simpledynamics.net| Nate Grover, Barrett Tucker}
@license
Copyright (c) 2016 Simple Dynamics, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

@class
@classdesc 
### This is the core engine for Seecret steganography.  

Seecret is a javascript utility for plaintext steganography.  Seecret can convert a plaintext string or array of numbers into an encoded string of hidden characters and embed them in covertexts.  The Seecret engine can also reconvert the resulting stegotexts back into plaintexts or number arrays.  

The default encoding uses zero-width whitespace characters as the 1 and 0 for a binary representation of the unicode value of the character or the number value of a number.

The core functionality includes:
  - Hiding and unhiding plaintext messages encoded in zero-width whitespace characters
  - Hiding and unhiding arrays of integers (the usual format of compression algorithms such as shoco and smaz)
  - Chaining and dechaining Seecrets that are broken up into an array of covertexts (for cases when the maximum content size of a stegotext is limited, such as Tweets)
    
	
@constructor
@param {object} [config] options - The configuration 
@param {character} [config.ZERO=0x200B] - the character to use as the 0 for binary
@param {character} [config.ONE=0x200C] - the character to use as 1 for binary
@param {character} [config.DELIMITER=0x200D] - the character used for a delimiter between binary unicode values.
@param {number} [config.MAX_CHAIN_SEGMENT_LENGTH=140] - The maximum length of the covertext + Seecret text in a chain segment. (140 will allow the stegotexts to fit into Tweets)
@param {number} [config.MAX_COVERTEXT_LENGTH=100] - the maximum length of the covertext for a chain segment
@param {boolean} [config.RANDOM_COVERTEXT=false] - If true, randomize the list of covertexts before building a chain
@param {object} [config.CONTENT_TYPES] - the content types that can be turned into Seecret text  
@param {string} [config.CONTENT_TYPES.PLAIN="1"] - Plain text
@param {string} [config.CONTENT_TYPES.NUMBERS_ARRAY="2"] - An array of numbers, which is the usual output from string compression algorithms such as shoco and smaz
@param {string} [config.ENVELOPE_START] - created during object construction, as a concatenation of two DELIMITER values.  Can be overridden after construction but should not be as other methods depend on Seecret only using ZERO, ONE and DELIMITER
@param {string} [config.ENVELOPE_END] - created during object construction, as a concatenation of three DELIMITER values.  Can be overridden after construction but should not be as other methods depend on Seecret only using ZERO, ONE and DELIMITER
@example //standard usage
var seecretInstance = new SEECRET_ENGINE(); 
//an example to allow very large stegotexts
var seecretInstance = new SEECRET_ENGINE({MAX_CHAIN_SEGMENT_LENGTH:10000,MAX_COVERTEXT_LENGTH:null}); 
//an example to generate Seecrets using visible config.ONE, config.ZERO and config.DELIMITER values.  Sometimes used during testing.
var seecretInstance = new SEECRET_ENGINE({ZERO:"0",ONE:"1","DELIMITER":"-"}); 

*/
var SEECRET_ENGINE = function(sConfig){
	/**
	@inner
	@default
	@type {object}
	@property {string} ZERO=0x200B - the value to use for the 0 when representing a binary number in Seecret encoding
	@property {string} ONE=0x200C - the value to use for the 1 when representing a binary number in Seecret encoding
	@property {string} DELIMITER=0x200D - the value to use to delimit the binary strings
	@property {number} MAX_CHAIN_SEGMENT_LENGTH=140 - The maximum length of the covertext + Seecret text in a chain segment. (140 will allow the stegotexts to fit into Tweets)
	@property {number} MAX_COVERTEXT_LENGTH=100 - the maximum length of the covertext for a chain segment
	@property {boolean} RANDOM_COVERTEXT=false - If true, randomize the list of covertexts before building a chain
	@property {object} CONTENT_TYPES - the content types that can be turned into Seecret text  
	@property {string} CONTENT_TYPES.PLAIN="1" - Plain text
	@property {string} CONTENT_TYPES.NUMBERS_ARRAY="2" - An array of numbers, which is the usual output from string compression algorithms such as shoco and smaz
	@property {string} ENVELOPE_START - created during object construction, as a concatenation of two DELIMITER values.  Can be overridden after construction but should not be as other methods depend on Seecret only using ZERO, ONE and DELIMITER
	@property {string} ENVELOPE_END - created during object construction, as a concatenation of three DELIMITER values.  Can be overridden after construction but should not be as other methods depend on Seecret only using ZERO, ONE and DELIMITER
	*/
	var SEECRET_DEFAULT_CONFIG = {
		ZERO:String.fromCharCode(0x200B),
		ONE:String.fromCharCode(0x200C),
		DELIMITER:String.fromCharCode(0x200D),
		MAX_CHAIN_SEGMENT_LENGTH:140,
		MAX_COVERTEXT_LENGTH:100,
		RANDOM_COVERTEXTS:false,
		CONTENT_TYPES:{
			PLAIN:"1",
			NUMBERS_ARRAY:"2"
		}
	}
	
	//backup plan for when there is no jQuery component available.  NOT a robust version of $.extend, only written to handle merging the exact structure of the Seecret configs
	/**
	For merging config values to the DEFAULT_SEECRET_CONFIG when jQuery is not present for $.extend.  This is NOT a robust object merging function.  It will only handle structures that match the DEFAULT_SEECRET_CONFIG object, merging properties from param two to param one if the named property in param two exists in param one.
	@param {object} one - the object to merge to (usually the inner SEECRET_DEFAULT_CONFIG)
	@param {object} two - the object to merge from
	@example 
var seecretInstance = new SEECRET_ENGINE();
seecretInstance.config = seecretInstance.mergeConfigs({RANDOM_COVERTEXTS:true})
	@returns {object} the merged properties object
	*/
	this.mergeConfigs = function(one,two) {
		for(var x in one){
			if(typeof two[x] != "undefined"){
				if(typeof one[x] == "object" && typeof two[x] == "object"){
					for(var y in one[x]){
						if(typeof two[x][y] != "undefined"){
							one[x][y] = two[x][y];
						}
					}
				}
				else {
					one[x]=two[x];
				}
			}
		}
		return one;
	}

	
	if(typeof jQuery != "undefined") {
		this.config = $.extend({},SEECRET_DEFAULT_CONFIG,sConfig);
	}
	else if(sConfig) {
		this.config=this.mergeConfigs(SEECRET_DEFAULT_CONFIG,sConfig);
	}
	else {
		this.config=SEECRET_DEFAULT_CONFIG;
	}
	
	this.config.ENVELOPE_START = this.config.DELIMITER+this.config.DELIMITER;
	this.config.ENVELOPE_END = this.config.ENVELOPE_START+this.config.DELIMITER;

	/**
	Convert a string or array of numbers into a Seecret string (a string of hidden characters).
	@param {string|number[]} val - the plaintext string or array of numbers to be converted
	@param {string} [contentType=config.CONTENT_TYPES.PLAIN] - one of the CONTENT_TYPES values in the config.  The contentType "NUMBERS_ARRAY" is an array of integers instead of a string.  "PLAIN" contentType is a plain old string of any unicode characters.  If no contentType is provided, the method will assume the contentType is "PLAIN".
	@example 
//A basic case
var seecretInstance = new SEECRET_ENGINE();
var hiddenText = seecretInstance.hide("this is the Seecret");

//hiding an array of integers
var compressed = [1,2,3,4,5,6,7,8,9,10];
var hiddenText = seecretInstance.hide(compressed,seecretInstance.config.CONTENT_TYPES.NUMBERS_ARRAY);

	@returns {string} the Seecret-encoded string 
	*/
	this.hide = function(val,contentType){
		if(contentType){
			switch(contentType){
				case this.config.CONTENT_TYPES.PLAIN:return this.hidePlainText(val);break;
				case this.config.CONTENT_TYPES.NUMBERS_ARRAY:return this.hideNumbersArray(val);break;
				default: return "";break
			}
		}
		else {
			return this.hide(val,this.config.CONTENT_TYPES.PLAIN);
		}
	}
	/**
	Convert a encoded hidden Seecret string back into an array of numbers or a string of unicode characters.
	@param {string} val - the plaintext string to be converted
	@param {string} [contentType=config.PLAIN] - one of the CONTENT_TYPES values in the config.  The contentType "NUMBERS_ARRAY" is an array of integers instead of a string.  "PLAIN" contentType is a plain old string of any unicode characters.  If no contentType is provided, the method will assume the contentType is "PLAIN".
	@returns {string} the plaintext string
	*/
	this.unhide = function(text,contentType){
		if(contentType){
			switch(contentType){
				case this.config.CONTENT_TYPES.PLAIN: return this.unhidePlainText(text);break;
				case this.config.CONTENT_TYPES.NUMBERS_ARRAY: return this.unhideNumbersArrayText(text);break;
				default: return "";
			}
		}
		else {
			return this.unhide(text,this.config.CONTENT_TYPES.PLAIN);
		}
	}
	/**
	Convert a plaintext string into a Seecret string.  Iterates through each character in the string and hides it via {@link SEECRET_ENGINE#hideCharacter}
	@param {string} val - the plaintext string to be converted
	@returns {string} the hidden Seecret text
	*/
	this.hidePlainText = function(text){
		var vals = Array();
		for (i=0;i<text.length;i++) {
			vals.push(this.hideCharacter(text[i]));
		}
		var returnVal =  vals.join(this.config.DELIMITER);
		return returnVal;
	}
	
	/**
	Convert a single character to a string of hidden characters representing the binary value of the unicode character number.  Used by {@link SEECRET_ENGINE#hidePlainText} to iterate through each character in the plaintext string and hide it.
	@param {string} character - the plaintext character to be converted
	@returns {string} the hidden character
	*/
	this.hideCharacter = function(character){
		var binString = character.charCodeAt(0).toString(2);
		return this.hideBinaryString(binString);
	}
	
	/**
	Convert a string of 0s and 1s representing a binary value into a string of config.ZERO and config.ONE values.  Used by {@link SEECRET_ENGINE#hideCharacter} and {@link SEECRET_ENGINE#hideNumber}
	@param {string} binString - the string of 1s and 0s
	@returns {string} a string of config.ZERO and config.ONE values
	*/
	this.hideBinaryString = function(binString){
		var output = "";
		for(j = 0; j < binString.length; j++) {
			output += binString[j] == 0?this.config.ZERO:this.config.ONE;
		}
		return output;
	}
	/**
	Convert a encoded hidden Seecret string back into a string of unicode characters.  Iterates through each delimited set of binary strings and unhides each one via the {@link SEECRET_ENGINE#unhideCharacter} method.
	@param {string} val - the Seecret string to be converted back into plaintext
	@returns {string}
	*/
	this.unhidePlainText = function(val){
		var vals = val.split(this.config.DELIMITER);
		var output="";
		for(var i=0;i<vals.length;i++){
			output += this.unhideCharacter(vals[i]);
		}
		return output;
	}
	/**
	Convert a Seecret-encoded binary number into a single unicode character that has that number code.  example:  0101010 (encoded as a Seecret string) would convert to Z.  This method is used by the {#link SEECRET_ENGINE#unhidePlainText} method to iteratoe through each delimited series of config.ZERO and config.ONE values and unhide each one into a string of "0" and "1" values.
	@param {string} val - the Seecret string of config.ZERO and config.ONE values to to be converted into a single unicode character.
	@returns {string}
	*/
	this.unhideCharacter=function(val){
		var binaryString = this.unhideBinaryString(val);
		return this.getCharacterFromBinaryString(binaryString);
	}
	/**
	Convert a string of config.ZERO and config.ONE values back into a string of 0s and 1s.  Used by {@link SEECRET_ENGINE#unhideCharacter} && {@link SEECRET_ENGINE#unhideNumber}
	@param {string} binaryString - the Seecret string of config.ZERO and config.ONE values to to be converted into the string of 0s and 1s
	@returns {string}
	*/
	this.unhideBinaryString = function(binaryString){
		var buffer = "";
		for(var i=0;i<binaryString.length;i++){
			buffer += binaryString[i] == this.config.ZERO?0:1;
		}
		return buffer;
	}
	/**
	Convert a string of 0s and 1s (eg. "0101010") into the unicode character that the binary number represents.  This method will return an empty string if the binary value does not convert to a unicode character.  Used by the {@link SEECRET_ENGINE#unhideNumber} method.
	@param {string} binaryString - The string of 0s and 1s to convert to a unicode character.  
	@returns {string}
	*/
	this.getCharacterFromBinaryString = function(binaryString){
		if(binaryString == ""){
			return "";
		}
		var charCode = parseInt(binaryString,2);
		if(isNaN(charCode)) return "";
		var val = String.fromCharCode(charCode);
		return val;
	}
	/**
	Convert an array of numbers into a string of hidden numbers.  Iterates through each number in the array and hides it by calling the {@link SEECRET_ENGINE#hideNumber} method.
	@param {number[]} val - the array of numbers to be converted
	@returns {string} the Seecret string
	*/
	this.hideNumbersArray = function(numbersArray){
		var vals = Array();
		for (i=0;i<numbersArray.length;i++) {
			vals.push(this.hideNumber(numbersArray[i]));
		}
		return vals.join(this.config.DELIMITER);
	}
	/**
	Convert a single number value into a string of hidden 0s and 1s that represent the number in binary.  Used by the {@link SEECRET_ENGINE#hideNumbersArray} method
	@param {number} numberVal - the number to be converted
	@returns {string}
	*/
	this.hideNumber = function(numberVal){
		var binVal = numberVal.toString(2);
		return this.hideBinaryString(binVal);
	}
	/**
	Convert a string of Seecret-encoded numbers back into an array of integers.  Creates and array from the delimited set of binary strings and unhides them all via {@link SEECRET_ENGINE#unhideBinaryArray} method.  
	@param {string} val - The string
	@returns {number[]}
	*/
	this.unhideNumbersArrayText = function(val){
		var splits = val.split(this.config.DELIMITER);
		var numbers = this.unhideBinaryArray(splits);
		return numbers;
	}
	/**
	Convert an array of Seecret-encoded binarys number back into an array of numbers. Iterates through an array of strings composed of config.ZERO and config.ONE values and unhides each one via the {@link SEECRET_ENGINE#unhideNumber} method.  Unhide in this case is to convert it into a number equal to the binary value.
	@param {array} binaryArray - The array of Seecret-encoded numbers
	@returns {string[]}
	*/
	this.unhideBinaryArray = function(binaryArray){
		var vals = Array();
		for(var i=0;i<binaryArray.length;i++){
			var numberVal = this.unhideNumber(binaryArray[i]);
			if(!isNaN(numberVal) ) {
				vals.push(numberVal);
			}
		}
		return vals;
	}
	/**
	Convert a Seecret-encoded binary number into a string of 1s and 0s.  Used by {@link SEECRET_ENGINE#unhideBinaryArray} to unhide all the binary strings in the array.
	@param {array} binaryArray - The array of Seecret-encoded numbers
	@returns {number}
	*/
	this.unhideNumber = function(hiddenNumber){
		var val = this.unhideBinaryString(hiddenNumber);
		return this.convertBinaryStringToNumber(val);
	}
	/**
	Convert a string of 1s and 0s into a number from the binary value
	@param {string} binaryString - A string of 1s and 0s
	@example  var binString = "1100011";  var number = seecretInstance.convertBinaryStringToNumber(binString); //will return 99
	@returns {number}
	*/
	this.convertBinaryStringToNumber = function(binaryString){
		if(binaryString == ""){
			return null;
		}
		var num = parseInt(binaryString,2);
		if(isNaN(num)) return null;
		return num;
	}
	/**
	Put a Seecret string in the middle of a plaintext covertext.  Used by {@link SEECRET_ENGINE#chainify} when constructing a list of covertexts for a single Seecret.
	@param {string} seecretText - A Seecret string
	@param {string} coverText - The covertext to contembed the Seecret string in.
	@returns {string}
	*/
	this.stegotext = function(seecretText,coverText){
		if(coverText==null || coverText.length < 2){
			throw INVALID_COVERTEXT_LENGTH_ERROR;
		}
		var startText = coverText.substr(0,coverText.length/2)
		var endText = coverText.substr(coverText.length/2,coverText.length);
		return startText + seecretText + endText;
	}
	/**
	Determine if a string contains any Seecret content
	@param {string} val - A string
	@returns {boolean}
	*/
	this.hasSeecretContent = function(val){
		for(var i=0;i<val.length;i++){
			if(this.isSeecretCharacter(val[i])) {
				return true;
			}
		}
		return false;
	}
	/**
	Determine if a character is a Seecret character (config.ZERO, config.ONE, or config.DELIMITER)
	@param {string} val - A character
	@returns {boolean}
	*/
	this.isSeecretCharacter = function(val){
		return val == this.config.ZERO || val == this.config.ONE || val == this.config.DELIMITER;
	}
	/**
	Extract the Seecret text from a string.  Returns an empty string if there is no Seecret text in it.  
	@param {string} val - A string
	@returns {string}
	*/
	this.extractSeecretText = function(val){
		var seecretText="";
		for(var i=0;i<val.length;i++){
			if(this.isSeecretCharacter(val[i])) {
				seecretText += val[i];
			}
		}
		return seecretText;
	}
	/**
	Extract the cover text from a string.  Returns an empty string if there is no plain text in the string.  
	@param {string} val - A string
	@returns {string}
	*/
	this.extractCovertext = function(val){
		var coverText="";
		for(var i=0;i<val.length;i++){
			if(!this.isSeecretCharacter(val[i])) {
				coverText += val[i];
			}
		}
		return coverText;
	}
	/**
	Create an envelope for Seecret encoded text.  The envelope consists of a cancatenation of the following:
		- the config.ENVELOPE_START value which is the same as config.DELIMITER + config.DELIMITER
		- a valid config.CONTENT_TYPES value 
		- the Seecret text (result of {@link SEECRET_ENGINE#hide} or {@link SEECRET_ENGINE#hidePlainText} or {@link SEECRET_ENGINE#hideBinaryString}
		- the config.ENVELOPE_END value which is the same as config.DELIMITER + config.DELIMITER + config.DELIMITER
	@param {string} seecretText - the Seecret text
	@param {string} [contentType=config.CONTENT_TYPES.PLAIN] - the CONTENT_TYPE value
	@returns {string}
	@throws INVALID_SEECRET_CONTENT_TYPE_ERRORk
	*/
	this.envelope=function(seecretText,contentType){
		if(!contentType){
			contentType = this.config.CONTENT_TYPES.PLAIN;
		}
		if(!this.isValidContentType(contentType)){
			throw INVALID_SEECRET_CONTENT_TYPE_ERROR;
		}
		var hiddenContentType = this.hideCharacter(contentType);
		var envelope = this.config.ENVELOPE_START + hiddenContentType + this.config.DELIMITER + seecretText + this.config.ENVELOPE_END;
		return envelope;
	}
	/**
	Determines if a Seecret-encoded string is a valid envelope format
	@param {string} seecretMessage - the string
	@returns {boolean}
	*/
	this.isValidEnvelope=function(seecretMessage){
		var startBookend = seecretMessage.substr(0,this.config.ENVELOPE_START.length);
		var endBookend = seecretMessage.substr(seecretMessage.length-this.config.ENVELOPE_END.length);
		if(startBookend != this.config.ENVELOPE_START){
			return false;
		}
		if(endBookend != this.config.ENVELOPE_END){
			return false;
		}
		var strippedMessage = this.stripEnvelopeBookends(seecretMessage);
		var splits = strippedMessage.split(this.config.DELIMITER);
		if(splits.length < 2){
			return false;
		}
		var contentType = this.unhideCharacter(splits[0]);
		return this.isValidContentType(contentType);
	}
	/**
	Remove the start and end codes from an envelope
	@param {string} envelope - the string
	@returns {string}
	*/
	this.stripEnvelopeBookends = function(envelope){
		return envelope.substr(this.config.ENVELOPE_START.length,envelope.length-(this.config.ENVELOPE_START.length+this.config.ENVELOPE_END.length));		
	}
	/**
	Get the content type value from a valid Seecret envelope
	@param {string} envelope - the string
	@returns {string}
	*/
	this.getContentTypeFromEnvelope=function(envelope){
		if(!this.isValidEnvelope(envelope)) {
			throw INVALID_SEECRET_ENVELOPE_ERROR;
		}
		var stripped = this.stripEnvelopeBookends(envelope);
		var vals = stripped.split(this.config.DELIMITER);
		var contentType = this.unhideCharacter(vals[0]);
		if(!this.isValidContentType(contentType)) {
			throw INVALID_SEECRET_CONTENT_TYPE_ERROR;
		}
		else {
			return contentType;
		}
	}
	/**
	Determine if the value is a valid content type constant (one of the values in the CONTENT_TYPES object of the config object)
	@param {string} contentType - the string
	@returns {boolean}
	*/
	this.isValidContentType = function(contentType){
		return (contentType == this.config.CONTENT_TYPES.PLAIN || contentType == this.config.CONTENT_TYPES.NUMBERS_ARRAY);
	}
	/**
	Extract the Seecret string from a valid Seecret envelope
	@param {string} envelope - the Seecret envelope
	@returns {string}
	*/
	this.getSeecretFromEnvelope = function(envelope){
		if(this.isValidEnvelope(envelope)){
			var stripped = this.stripEnvelopeBookends(envelope);
			var splits = stripped.split(this.config.DELIMITER);
			var messageVals = splits.slice(1);
			var message = messageVals.join(this.config.DELIMITER);
			return message;
		}
		else {
			throw INVALID_SEECRET_ENVELOPE_ERROR;
		}
	}
	/**
	Convert a valid Seecret envelope into an array of stegotext strings
	@param {string} envelope - A valid Seecret envelope
	@param {string[]} covertexts - an array of covertexts
	@returns {string[]}
	@throws COVERTEXTS_REQUIRED_ERROR if there are no covertexts provided
	@throws INVALID_COVERTEXT_LENGTH_ERROR if there are there are covertexts shorter than 2 characters or longer than the config.MAX_COVERTEXT_LENGTH value
	@throws NOT_ENOUGH_COVERTEXTS_ERROR if there are not enough covertexts to contain the Seecret
	@throws CHAIN_SEGMENT_SIZING_ERROR if the first covertext + the beginning of the Seecret are not able to contain the full ENVELOPE_START value of the Seecret envelope without exceeding the config.MAX_CHAIN_SEGMENT_LENGTH value
	*/
	this.chainify=function(envelope,covertexts){
		if(!envelope || !this.isValidEnvelope(envelope)){
			throw INVALID_SEECRET_ENVELOPE_ERROR;
		}
		if(!covertexts){
			throw COVERTEXTS_REQUIRED_ERROR;
		}
		for(var s in covertexts){
			if(covertexts[s].length < 2 || (this.config.MAX_COVERTEXT_LENGTH && covertexts[s].length > this.config.MAX_COVERTEXT_LENGTH)  ){
				throw INVALID_COVERTEXT_LENGTH_ERROR;
			}
		}
		if(this.config.RANDOM_COVERTEXTS){
			covertexts = this.shuffleArray(covertexts.slice(0));
		}
		//the first chain item MUST be able to contain the full text of the ENVELOPE_START value
		var chain = Array();
		var segmentStart=0;
		var segmentCount=0;
		while(segmentStart < envelope.length){
			if(chain.length == covertexts.length){
				throw NOT_ENOUGH_COVERTEXTS_ERROR;
			}
			var covertext = covertexts[segmentCount++];
			var currentSegmentLength = this.config.MAX_CHAIN_SEGMENT_LENGTH-covertext.length;
			var segment = envelope.substr(segmentStart,currentSegmentLength);
			//if the first segment did not fully contain the ENVELOPE_START value, throw an error
			if(segmentCount == 1 && !this.isEnvelopeStart(this.extractSeecretText(segment))){
				throw CHAIN_SEGMENT_SIZING_ERROR;
			}
			chain.push(this.stegotext(segment,covertext));
			segmentStart += currentSegmentLength;
		}
		return chain;
	}
	/**
	Returns true if the Seecret string ends ends with the same value as the config.ENVELOPE_START value
	@param {string} hiddenText - the Seecret-encoded string
	@returns {boolean}
	*/
	this.isEnvelopeStart = function(hiddenText){
		return hiddenText.substr(0,this.config.ENVELOPE_START.length) == this.config.ENVELOPE_START;
	}
	/**
	Returns true if the Seecret string ends ends with the same value as the config.ENVELOPE_END value
	@param {string} hiddenText - the Seecret-encoded string
	@returns {boolean}
	*/
	this.isEnvelopeEnd = function(hiddenText){
		return hiddenText.substr(hiddenText.length-this.config.ENVELOPE_END.length) == this.config.ENVELOPE_END;
	}
	/**
	A function that checks if the object is a valid chain segment for the given chain.  Default function returns true if it is a string.  This can be overridden by one of the params for the {@link SEECRET_ENGINE#dechainify} method
	@param {object} chainSegment - the object
	@returns {boolean}
	*/
	this.chainSegmentMatcher = function(chainSegment) {return typeof chainSegment == "string";}
	/**
	Returns the Seecret string from an object.  Default function returns the whole object on the assumption it is a string.  This can be overridden by one of the params for the {@link SEECRET_ENGINE#dechainify} method
	@param {object} chainSegment - the object
	@returns {string}
	*/
	this.chainSegmentContentFinder = function(chainSegment) {return chainSegment;}
	/**
	Returns the index of the array element that is the start of the ordinal message 
	@param {array} chain - An array of covertexts with Seecrets or objects that contain the covertexts with Seecrets
	@param {object} [params] see {@link SEECRET_ENGINE dechainify}
	@returns {number|null}
	*/
	this.getOrdinalIndex = function(chain,params){
		var index=0;
		var startFound=false;
		var chainSegmentMatcher = params && params.chainSegmentMatcher?params.chainSegmentMatcher:this.chainSegmentMatcher;
		var chainSegmentContentFinder = params && params.chainSegmentContentFinder?params.chainSegmentContentFinder:this.chainSegmentContentFinder;
		for(var i=0;i<chain.length;i++){
			if(chainSegmentMatcher(chain[i])){
				var content = chainSegmentContentFinder(chain[i]);
				if(!this.hasSeecretContent(content)){
					continue;
				}
				var seecretContent = this.extractSeecretText(content);
				if(!startFound && this.isEnvelopeStart(seecretContent) && params.ordinal==index++){
					return i;break;
				}
			}
		}
		return null;
	}
	/**
	Returns an array of all starting indexes of complete Seecret messages found in the array.
	@param {array} chain - An array of covertexts with Seecrets or objects that contain the covertexts with Seecrets
	@param {object} [params] see {@link SEECRET_ENGINE dechainify}
	@returns {number[]}
	*/
	this.getOrdinalIndexes = function(chain,params){
		var ordinals = [];
		var startFound=false;
		var chainSegmentMatcher = params && params.chainSegmentMatcher?params.chainSegmentMatcher:this.chainSegmentMatcher;
		var chainSegmentContentFinder = params && params.chainSegmentContentFinder?params.chainSegmentContentFinder:this.chainSegmentContentFinder;
		var startIndex = 0;
		for(var i=0;i<chain.length;i++){
			if(chainSegmentMatcher(chain[i])){
				var content = chainSegmentContentFinder(chain[i]);
				if(!this.hasSeecretContent(content)){
					continue;
				}
				var seecretContent = this.extractSeecretText(content);
				if(!startFound && this.isEnvelopeStart(seecretContent)){
					startFound=true;
					startIndex = i;
				}
				else if(startFound && this.isEnvelopeEnd(seecretContent)){
					startFound=false;
					ordinals.push(startIndex);
				}
			}
		}
		return ordinals;
	}
	/**
	Returns a dechainified Seecret reconstituted from chain segments found within the array.  If the covertexts exist in the array, IN ORDER, the Seecret will be returned.  Otherwise returns an empty string.  
	@param {array} chain - an array
	@param {params} [params] - The params for dechainifying the Seecret from the array.
	@param {params.ordinal} [params.ordinal=0] - The ordinal number of the Seecret to look for if the array may contain more than one Seecret.  Seecrets are assumed to be chained in order, and start and end without overlapping each other.  The oridnal value is 0 based so a value of 1 means it will return the SECOND Seecret.
	@param {function} [params.chainSegmentMatcher] - A function to override the default chainSegmentMatcher. 
	@param {function} [params.chainSegmentContentFinder] - A function to override the default chainSegmentContentFinder. 
	@example  //simple case of dechainifying a seecret from an array of strings  
var mySeecret = seecretInstance.dechainify(arrayOfStrings)
	
//dechainifying from an array of objects where .seecret is the property on each object that holds the stegotext
var mySeecret = seecretInstance.dechainify(arrayofObjects,{
		chainSegmentMatcher:function(segment){
			return segment && typeof segment == "object" && segment.seecret;
		},
		chainSegmentContentFinder:function(segment){
			//assumes we have already validated the segment with chainSegmentMatcher
			return segment.seecret;
		}
	});

//dechainify the third Seecret to be found in the array
var mySeecret = seecretInstance.dechainify(arrayOfSeecrets,{ordinal:2});
	@returns {string}
	*/
	this.dechainify=function(chain,params){
		var ordinal = params && params.ordinal?params.ordinal:0;
		var chainSegmentMatcher = params && params.chainSegmentMatcher?params.chainSegmentMatcher:this.chainSegmentMatcher;
		var chainSegmentContentFinder = params && params.chainSegmentContentFinder?params.chainSegmentContentFinder:this.chainSegmentContentFinder;
		var index =0;
		var startFound = false;
		var endFound = false;
		var dechainedSeecret = "";
		for(var i=0;i<chain.length;i++){
			if(chainSegmentMatcher(chain[i])){
				var content = chainSegmentContentFinder(chain[i]);
				if(!this.hasSeecretContent(content)){
					continue;
				}
				var seecretContent = this.extractSeecretText(content);
				if(!startFound && this.isEnvelopeStart(seecretContent) && ordinal==index++){
					index = i;
					startFound=true;
					dechainedSeecret = seecretContent;
				}
				else if(startFound){
					dechainedSeecret += seecretContent;
					if(!endFound && this.isEnvelopeEnd(seecretContent)){
						endFound=true;
						break;
					} 
				}
			}
		}
		return endFound?dechainedSeecret:"";
	}
	
	//generic utilities unrelated to Seecret features but we want to have them here so Seecret can stand alone without any dependencies
	
	/**
	@description For use when the config.RANDOM_COVERTEXTS value is set to true.  Shuffles the covertexts that were passed into the {@link SEECRET_ENGINE#hide} method.
Using Durstendfeld shuffle algorithm, based on Fisher-Yates shuffle 
Note: This modifies the array that is passed in, so the code should pass in a .slice(0) version of the original array if the original order needs to be preserved for other uses.
@see {@link https://en.wikipedia.org/wiki/Fisher-Yates_shuffle#The_modern_algorithm} for a discussion of this algorithm
	@param {array} array - The array to be shuffled
	returns {array}
	*/
	this.shuffleArray=function(array){
	   for (var i = array.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
		return array;
	}

	/**
	Exception thrown when the Seecret envelope is not valid.
	*/
	var INVALID_SEECRET_ENVELOPE_ERROR = {name:"INVALID_SEECRET_ENVELOPE_ERROR",message:"This Seecret envelope is not valid.  Must start with the config.ENVELOPE_START value and second character must be a config.CONTENT_TYPES value",toString:function(){return this.name + " : " + this.message;} }
	/**
	Exception thrown when the contentType value is not one of the config.CONTENT_TYPES values
	*/
	var INVALID_SEECRET_CONTENT_TYPE_ERROR = {name:"INVALID_SEECRET_CONTENT_TYPE_ERROR",message:"This Seecret content is not valid.  Must be " + JSON.stringify(this.config.CONTENT_TYPES),toString:function(){return this.name + " : " + this.message;}};
	/**
	Exception thrown if the covertext is null or too short - less than 2 characters.
	*/
	var INVALID_COVERTEXT_LENGTH_ERROR = {name:"INVALID_COVERTEXT_LENGTH_ERROR",message:"This covertext is not valid.  It must be no more than " + this.config.MAX_COVERTEXT_LENGTH + " characters",toString:function(){return this.name + " : " + this.message;}};
	/**
	Exception thrown if trying to {@link SEECRET_ENGINE#chainify} without any covertexts
	*/
	var COVERTEXTS_REQUIRED_ERROR = {name:"COVERTEXTS_REQUIRED_ERROR",message:"In order to chainify a Seecret you must provide the covertext values.",toString:function(){return this.name + " : " + this.message;}};
	/**
	Exception thrown if trying to chainify but not enough covertexts are provided to chainify the whole Seecret
	*/
	var NOT_ENOUGH_COVERTEXTS_ERROR = {name:"NOT_ENOUGH_COVERTEXTS_ERROR",message:"In order to chainify a Seecret you must provide enough covertext values.",toString:function(){return this.name + " : " + this.message;}};
	/**
	Exception thrown if the first covertext for the first segment of the chain can't contain a complete ENVELOPE_START code without exceeding the MAX_CHAIN_SEGMENT_LENGTH value
	*/
	var CHAIN_SEGMENT_SIZING_ERROR = {name:"CHAIN_SEGMENT_SIZING_ERROR",message:"The first chain segment of the chain must be able to contain the full text of the config.ENVELOPE_START value",toString:function(){return this.name + " : " + this.message;}}
}

