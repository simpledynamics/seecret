//Jasmine based unit test
//@see http://jasmine.github.io/2.0/introduction.html

describe("Seecret Core", function() {

	it("Should merge configs correctly when no jquery available", function() { 
        seecret = new SEECRET_ENGINE({ONE:"1",ZERO:"0",DELIMITER:"-",CONTENT_TYPES:{PLAIN:"111"},FOO:"whatever"});
		expect(seecret.config.ONE).toEqual("1");
		expect(seecret.config.ZERO).toEqual("0");
		expect(seecret.config.DELIMITER).toEqual("-");
		expect(seecret.config.CONTENT_TYPES.PLAIN).toEqual("111");
		expect(seecret.config.CONTENT_TYPES.FOO).not.toBeDefined();
	});

	it("Should convert a binary string representation of a unicode character code into a unicode character", function() { 
        seecret = new SEECRET_ENGINE();
		var val = "a";
		var binaryString = val.charCodeAt(0).toString(2);
		expect(binaryString).toEqual("1100001");
		var charVal = seecret.getCharacterFromBinaryString(binaryString);
		expect(charVal).toEqual(val)
	});

	it("Should hide and unhide a single character", function() { 
        seecret = new SEECRET_ENGINE();
		var val = "a";
		var hiddenVal = seecret.hideCharacter(val);
		var unhiddenVal = seecret.unhideCharacter(hiddenVal);
		expect(unhiddenVal).toEqual(val);
	});

	it("Should hide and unhide a plaintext string", function() { 
        seecret = new SEECRET_ENGINE();
		var val = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
		var hidden = seecret.hidePlainText(val);
		var unhidden = seecret.unhidePlainText(hidden);
		expect(unhidden).toEqual(val);
	});

	it("Should correctly default to plain text if no content type is provided ", function() { 
        seecret = new SEECRET_ENGINE();
		var val = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
		var hidden = seecret.hide(val);
		var unhidden = seecret.unhidePlainText(hidden);
		expect(unhidden).toEqual(val);
	});
	
	it("Should convert a binary string representation of a binary number into a decimal number", function() { 
        seecret = new SEECRET_ENGINE();
		var val = "1111";//15
		var number = seecret.convertBinaryStringToNumber(val)
		expect(number).toEqual(15);
	});

	it("Should hide and unhide a number", function() { 
        seecret = new SEECRET_ENGINE();
		var val = 15;
		var hiddenVal = seecret.hideNumber(val);
		var unhiddenVal = seecret.unhideNumber(hiddenVal);
		expect(unhiddenVal).toEqual(val);
	});

	it("Should hide and unhide an array of numbers", function() { 
        seecret = new SEECRET_ENGINE();
		var val = [1,2,3,4,5,5,6,7,8,8,9,10, 11,22,33,44,55,66,77,88,99];
		var hiddenVal = seecret.hideNumbersArray(val);
		var unhiddenVal = seecret.unhideNumbersArrayText(hiddenVal);
		expect(JSON.stringify(unhiddenVal)).toEqual(JSON.stringify(val));
	});

	it("Should recognize if a character is a Seecret or non-Seecret character", function() { 
        seecret = new SEECRET_ENGINE();
		var seecretResult = seecret.isSeecretCharacter(seecret.config.ZERO);
		var nonSeecretResult = seecret.isSeecretCharacter("F");
		expect(seecretResult).toBe(true);
		expect(nonSeecretResult).toBe(false);
	});

	it("Should identify Seecret text within a string", function() { 
        seecret = new SEECRET_ENGINE();
		var val = "new test val to seecretize";
		var hiddenVal = seecret.hidePlainText(val);
		var totalString = seecret.stegotext(hiddenVal,"this is the plain text envelope for the Seecret text");
		var result= seecret.hasSeecretContent(totalString);
		expect(result).toBe(true);
	});

	it("Should extract Seecret text from within a string", function() { 
        seecret = new SEECRET_ENGINE();
		var val = "Some test val to seecretize";
		var hiddenVal = seecret.hidePlainText(val);
		var totalString = seecret.stegotext(hiddenVal,"this is the plain text envelope for the Seecret text");
		var extractedSeecret = seecret.extractSeecretText(totalString);
		expect(extractedSeecret).toEqual(hiddenVal);
	});

	it("Should remove Seecret text from within a string", function() { 
        seecret = new SEECRET_ENGINE();
		var val = "Some test val to seecretize";
		var covertext = "this is the plain text envelope for the Seecret text";
		var hiddenVal = seecret.hidePlainText(val);
		var totalString = seecret.stegotext(hiddenVal,covertext);
		var extractedval = seecret.extractCovertext(totalString);
		expect(extractedval).toEqual(covertext);
	});

	it("Should make an envelope for a Seecret text that is valid", function() { 
		seecret = new SEECRET_ENGINE();
        //seecret = new SEECRET({ONE:"1",ZERO:"0",DELIMITER:"-",BOOKEND:"$--$"});
		var val = "test";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);;
		expect(seecret.isValidEnvelope(envelope)).toBe(true);
	});

	it("Should default to config.CONTENT_TYPES.PLAIN when making an envelope if no CONTENT_TYPES value is supplied", function() { 
		seecret = new SEECRET_ENGINE();
		var val = "test";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal);
		var contentType = seecret.getContentTypeFromEnvelope(envelope);
		expect(contentType).toEqual(seecret.config.CONTENT_TYPES.PLAIN);
	});

	it("Should throw an INVALID_SEECRET_CONTENT_TYPE_ERROR when calling envelope with an invalid content type", function() { 
		seecret = new SEECRET_ENGINE();
        //seecret = new SEECRET({ONE:"1",ZERO:"0",DELIMITER:"-",BOOKEND:"$--$"});
		var val = "test";
		var hiddenVal = seecret.hidePlainText(val);
		var bErrorCaught=false;
		try{
			var envelope = seecret.envelope(hiddenVal,"FOO");;
			bErrorCaught=true;
		}
		catch(e){
			bErrorCaught=true;
			expect(e.name).toEqual("INVALID_SEECRET_CONTENT_TYPE_ERROR");
		}
		expect(bErrorCaught).toBe(true);
	});

	it("Should make an envelope for a Seecret text and determine content type from it", function() { 
		seecret = new SEECRET_ENGINE();
        //seecret = new SEECRET({ONE:"1",ZERO:"0",DELIMITER:"-",BOOKEND:"$--$"});
		var val = "this is a test value to hide";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var contentType = seecret.getContentTypeFromEnvelope(envelope);
		expect(contentType).toEqual(seecret.config.CONTENT_TYPES.PLAIN);
	});

	it("Should throw an INVALID_SEECRET_ENVELOPE_ERROR when an envelope is invalid", function() { 
		seecret = new SEECRET_ENGINE();
        //seecret = new SEECRET({ONE:"1",ZERO:"0",DELIMITER:"-",BOOKEND:"$--$"});
		var val = "test value for testing";
		var hiddenVal = seecret.hidePlainText(val);
		var bErrorCaught=false;
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN) + "some extra stuff";
		try{
			var content = seecret.getContentTypeFromEnvelope(envelope);
		}
		catch(e){
			bErrorCaught=true;
			expect(e.name).toEqual("INVALID_SEECRET_ENVELOPE_ERROR");
		}
		expect(bErrorCaught).toBe(true);
	});

	it("Should throw an INVALID_SEECRET_CONTENT_TYPE_ERROR when the content type is invalid", function() { 
		//seecret = new SEECRET_ENGINE();
        seecret = new SEECRET_ENGINE({ONE:"1",ZERO:"0",DELIMITER:"-"});
		var val = "test value for testing";
		var hiddenVal = seecret.hidePlainText(val);
		var bErrorCaught=false;
		try{
			var envelope = seecret.envelope(hiddenVal,"$");
			var content = seecret.getContentTypeFromEnvelope(envelope);
		}
		catch(e){
			bErrorCaught=true;
			expect(e.name).toEqual("INVALID_SEECRET_CONTENT_TYPE_ERROR");
		}
		expect(bErrorCaught).toBe(true);
	});

	it("Should extract a Seecret message from a valid envelope", function() { 
		seecret = new SEECRET_ENGINE();
		var val = "test value for testing";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var seecretMessage = seecret.getSeecretFromEnvelope(envelope);
		expect(seecretMessage).toEqual(hiddenVal);
	});

	it("Should throw an INVALID_COVERTEXT_LENGTH_ERROR if the cover text has fewer than two characters.", function() { 
		seecret = new SEECRET_ENGINE();
		var val = "test value for testing";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var bErrorCaught = false;
		try{
			var embeddedText = seecret.stegotext(envelope,"a");
			
		}
		catch(e){
			bErrorCaught=true;
			expect(e.name).toEqual("INVALID_COVERTEXT_LENGTH_ERROR");
		}
		expect(bErrorCaught).toBe(true);
	});

	it("Should throw an INVALID_SEECRET_ENVELOPE_ERROR  when trying to chainify an invalid envelope", function() { 
		seecret = new SEECRET_ENGINE();
		var val = "test value for testing";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var bErrorCaught = false;
		try{
			var chain = seecret.chainify(envelope,["asdfasdfasd","asld"]);
			bErrorCaught = true;
		}
		catch(e){
			bErrorCaught=true;
			expect(e.name).toEqual("INVALID_SEECRET_ENVELOPE_ERROR");
		}
		expect(bErrorCaught).toBe(true);
	});

	it("Should throw a COVERTEXTS_REQUIRED_ERROR when trying to chainify with no covertexts", function() { 
		seecret = new SEECRET_ENGINE();
		var val = "test value for testing";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var bErrorCaught = false;
		try{
			var chain = seecret.chainify(envelope);
			
		}
		catch(e){
			bErrorCaught=true;
			expect(e.name).toEqual("COVERTEXTS_REQUIRED_ERROR");
		}
		expect(bErrorCaught).toBe(true);
	});
	
	it("Should throw an INVALID_COVERTEXT_LENGTH_ERROR when trying to chainify with any covertexts that are below 2 characters in length", function() { 
		seecret = new SEECRET_ENGINE();
		var val = "test value for testing";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var bErrorCaught = false;
		try{
			var covertexts = ["asdf","b"];
			var chain = seecret.chainify(envelope,covertexts);
			
		}
		catch(e){
			bErrorCaught=true;
			expect(e.name).toEqual("INVALID_COVERTEXT_LENGTH_ERROR");
		}
		expect(bErrorCaught).toBe(true);
	});

	it("Should throw an INVALID_COVERTEXT_LENGTH_ERROR when trying to chainify with any covertexts that exceed the MAX_COVERTEXT_LENGTH config property value.", function() { 
		seecret = new SEECRET_ENGINE({MAX_COVERTEXT_LENGTH:8});
		var val = "test value for testing";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var bErrorCaught = false;
		try{
			var covertexts = ["hello","asdfasdff"];
			var chain = seecret.chainify(envelope,covertexts);
			
		}
		catch(e){
			bErrorCaught=true;
			expect(e.name).toEqual("INVALID_COVERTEXT_LENGTH_ERROR");
		}
		expect(bErrorCaught).toBe(true);
	});

	it("Should chainify a Seecret message into an array of strings", function() { 
		seecret = new SEECRET_ENGINE({MAX_CHAIN_SEGMENT_LENGTH:40});
		var val = "chain test";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var chain = seecret.chainify(envelope,["aa","bb","cc","dd","ee"]);
		expect(chain.length).toBeGreaterThan(0);
		for(var each in chain){
			var isString = typeof chain[each]=="string";
			expect(isString).toBe(true);
		}
	});

	it("Should throw a NOT_ENOUGH_COVERTEXTS_ERROR when trying to chainify without enough covertexts for the message.", function() { 
		seecret = new SEECRET_ENGINE({MAX_COVERTEXT_LENGTH:8,MAX_CHAIN_SEGMENT_LENGTH:10});
		var val = "test value for testing";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var bErrorCaught = false;
		try{
			var covertexts = ["hello","asdfas"];
			var chain = seecret.chainify(envelope,covertexts);
			
		}
		catch(e){
			bErrorCaught=true;
			expect(e.name).toEqual("NOT_ENOUGH_COVERTEXTS_ERROR");
		}
		expect(bErrorCaught).toBe(true);
	});
	
	it("Should recognize the start of an envelope", function() { 
		seecret = new SEECRET_ENGINE();
		var val = "chain test";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var isStart = seecret.isEnvelopeStart(envelope);
		expect(isStart).toBe(true);
		isStart = seecret.isEnvelopeStart(hiddenVal);
		expect(isStart).toBe(false);
	});
	
	it("Should recognize the end of an envelope", function() { 
		seecret = new SEECRET_ENGINE();
		var val = "chain test";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var isStart = seecret.isEnvelopeEnd(envelope);
		expect(isStart).toBe(true);
		isStart = seecret.isEnvelopeEnd(hiddenVal);
		expect(isStart).toBe(false);
	});
	
	it("Should dechainify a chainified Seecret message", function() { 
        seecret = new SEECRET_ENGINE({ONE:"1",ZERO:"0",DELIMITER:"-",MAX_CHAIN_SEGMENT_LENGTH:40});
		var val = "chain test";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var chain = seecret.chainify(envelope,["aa","bb","cc","dd","ee"]);
		expect(chain.length).toBeGreaterThan(0);
		var dechainedEnvelope = seecret.dechainify(chain);
		expect(dechainedEnvelope).toEqual(envelope);
	});
	
	it("Should return a blank string when dechainifying an incomplete chain", function() { 
        //seecret = new SEECRET_ENGINE({ONE:"1",ZERO:"0",DELIMITER:"-",MAX_CHAIN_SEGMENT_LENGTH:100});
		seecret = new SEECRET_ENGINE();
		var val = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididu.";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var chain = seecret.chainify(envelope,["aa","bb","cc","dd","ee","ff","gg","hh","ii","jj","kk","ll"]);
		expect(chain.length).toBeGreaterThan(0);
		chain=chain.slice(0,chain.length-2);
		
		var dechainedEnvelope = seecret.dechainify(chain);
		expect(dechainedEnvelope).toEqual("");
	});

	it("Should dechainify correctly with a custom chainSegmentContentFinder and chainSegmentMatcher when the chain items are objects instead of strings", function() { 
        //seecret = new SEECRET_ENGINE({ONE:"1",ZERO:"0",DELIMITER:"-",MAX_CHAIN_SEGMENT_LENGTH:100});
		seecret = new SEECRET_ENGINE();
		var val = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididu.";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var chain = seecret.chainify(envelope,["aa","bb","cc","dd","ee","ff","gg","hh","ii","jj","kk","ll"]);
		var objectChain = Array();
		for(var each in chain){
			objectChain.push({seecret:chain[each]})
		}
		var dechainedEnvelope = seecret.dechainify(objectChain,
			{
				chainSegmentContentFinder:function(chainItem){
					return chainItem.seecret;
				},
				chainSegmentMatcher:function(segment){return segment;}
			}
			
		);
		expect(dechainedEnvelope).toEqual(envelope);
	});
	
	it("Should dechainify correctly when the list chain items are intermingled with unrelated elements.", function() { 
        //seecret = new SEECRET_ENGINE({ONE:"1",ZERO:"0",DELIMITER:"-",MAX_CHAIN_SEGMENT_LENGTH:100});
		seecret = new SEECRET_ENGINE();
		var val = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididu.";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var chain = seecret.chainify(envelope,["aa","bb","cc","dd","ee","ff","gg","hh","ii","jj","kk","ll"]);
		var objectChain = Array();
		for(var each in chain){
			objectChain.push({seecret:chain[each]})
			objectChain.push("test")
		}
		var dechainedEnvelope = seecret.dechainify(objectChain,
			{
				chainSegmentContentFinder:function(chainItem){
					return chainItem.seecret;
				},
				chainSegmentMatcher:function(segment){return segment && segment.seecret && typeof segment.seecret == "string"?segment:null;}
			}
			
		);
		expect(dechainedEnvelope).toEqual(envelope);
	});
	
	
	it("Should dechainify the right Seecret based on params.ordinal", function() { 
        seecret = new SEECRET_ENGINE({ONE:"1",ZERO:"0",DELIMITER:"-",MAX_CHAIN_SEGMENT_LENGTH:100});
		//seecret = new SEECRET_ENGINE();
		var val = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididu.";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var chain = seecret.chainify(envelope,["aa","bb","cc","dd","ee","ff","gg","hh","ii","jj","kk","ll"]);
		var objectChain = Array();
		for(var each in chain){
			objectChain.push({seecret:chain[each]})
			objectChain.push("test")
		}
		var val2 = "esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non";
		var hiddenVal2 = seecret.hidePlainText(val2);
		var envelope2 = seecret.envelope(hiddenVal2,seecret.config.CONTENT_TYPES.PLAIN);
		var chain2 = seecret.chainify(envelope2,["aa","bb","cc","dd","ee","ff","gg","hh","ii","jj","kk","ll"]);
		for(var each in chain2){
			objectChain.push({seecret:chain2[each]})
			objectChain.push("test")
		}
		var val3 = "ididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation";
		var hiddenVal3 = seecret.hidePlainText(val3);
		var envelope3 = seecret.envelope(hiddenVal3,seecret.config.CONTENT_TYPES.PLAIN);
		var chain3 = seecret.chainify(envelope3,["aa","bb","cc","dd","ee","ff","gg","hh","ii","jj","kk","ll"]);
		for(var each in chain3){
			objectChain.push({seecret:chain3[each]})
			objectChain.push("test")
		}
		
		var dechainedEnvelope = seecret.dechainify(objectChain,
			{
				chainSegmentContentFinder:function(chainItem){
					return chainItem.seecret;
				},
				chainSegmentMatcher:function(segment){return segment && segment.seecret && typeof segment.seecret == "string"?segment:null;},
				ordinal:1
			}
			
		);
		expect(dechainedEnvelope).toEqual(envelope2);
	});
	
	it("Should return the index of the chain element that is the start of the ordinal Seecret", function() { 
        //seecret = new SEECRET_ENGINE({ONE:"1",ZERO:"0",DELIMITER:"-",MAX_CHAIN_SEGMENT_LENGTH:100});
		seecret = new SEECRET_ENGINE();
		var val = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididu.";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var chain = seecret.chainify(envelope,["aa","bb","cc","dd","ee","ff","gg","hh","ii","jj","kk","ll"]);
		var objectChain = Array();
		var expectedIndex1 = 0;
		for(var each in chain){
			objectChain.push({seecret:chain[each]})
			objectChain.push("test")
		}
		var val2 = "esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non";
		var hiddenVal2 = seecret.hidePlainText(val2);
		var envelope2 = seecret.envelope(hiddenVal2,seecret.config.CONTENT_TYPES.PLAIN);
		var chain2 = seecret.chainify(envelope2,["aa","bb","cc","dd","ee","ff","gg","hh","ii","jj","kk","ll"]);
		var expectedIndex2 = objectChain.length;
		for(var each in chain2){
			objectChain.push({seecret:chain2[each]})
			objectChain.push("test")
		}
		
		var val3 = "ididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation";
		var hiddenVal3 = seecret.hidePlainText(val3);
		var envelope3 = seecret.envelope(hiddenVal3,seecret.config.CONTENT_TYPES.PLAIN);
		var chain3 = seecret.chainify(envelope3,["aa","bb","cc","dd","ee","ff","gg","hh","ii","jj","kk","ll"]);
		var expectedIndex3 = objectChain.length;
		for(var each in chain3){
			objectChain.push({seecret:chain3[each]})
			objectChain.push("test")
		}
		
		var params = {
			chainSegmentContentFinder:function(chainItem){
				return chainItem.seecret;
			},
			chainSegmentMatcher:function(segment){return segment && segment.seecret && typeof segment.seecret == "string"?segment:null;},
			ordinal:0
		}

		var result = seecret.getOrdinalIndex(objectChain,params);
		expect(result).toEqual(expectedIndex1);
		params.ordinal++;
		result = seecret.getOrdinalIndex(objectChain,params);
		expect(result).toEqual(expectedIndex2);
		params.ordinal++;
		result = seecret.getOrdinalIndex(objectChain,params);
		expect(result).toEqual(expectedIndex3);
	});
	
	it("Should return the list of indexes of the chain elements that are the start of the Seecrets in the list", function() { 
        //seecret = new SEECRET_ENGINE({ONE:"1",ZERO:"0",DELIMITER:"-",MAX_CHAIN_SEGMENT_LENGTH:100});
		seecret = new SEECRET_ENGINE();
		var val = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididu.";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var chain = seecret.chainify(envelope,["aa","bb","cc","dd","ee","ff","gg","hh","ii","jj","kk","ll"]);
		var objectChain = Array();
		var expectedIndex1 = 0;
		for(var each in chain){
			objectChain.push({seecret:chain[each]})
			objectChain.push("test")
		}
		var val2 = "esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non";
		var hiddenVal2 = seecret.hidePlainText(val2);
		var envelope2 = seecret.envelope(hiddenVal2,seecret.config.CONTENT_TYPES.PLAIN);
		var chain2 = seecret.chainify(envelope2,["aa","bb","cc","dd","ee","ff","gg","hh","ii","jj","kk","ll"]);
		var expectedIndex2 = objectChain.length;
		for(var each in chain2){
			objectChain.push({seecret:chain2[each]})
			objectChain.push("test")
		}
		
		var val3 = "ididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation";
		var hiddenVal3 = seecret.hidePlainText(val3);
		var envelope3 = seecret.envelope(hiddenVal3,seecret.config.CONTENT_TYPES.PLAIN);
		var chain3 = seecret.chainify(envelope3,["aa","bb","cc","dd","ee","ff","gg","hh","ii","jj","kk","ll"]);
		var expectedIndex3 = objectChain.length;
		for(var each in chain3){
			objectChain.push({seecret:chain3[each]})
			objectChain.push("test")
		}
		
		var params = {
			chainSegmentContentFinder:function(chainItem){
				return chainItem.seecret;
			},
			chainSegmentMatcher:function(segment){return segment && segment.seecret && typeof segment.seecret == "string"?segment:null;}
		}

		var result = seecret.getOrdinalIndexes(objectChain,params);
		
		expect(result).toBeDefined();
		expect(result.length).toBeDefined();
		expect(result.length).toEqual(3);
		expect(result[0]).toEqual(expectedIndex1);
		expect(result[1]).toEqual(expectedIndex2);
		expect(result[2]).toEqual(expectedIndex3);
	});
	
	it("should dechainify and return the Seecret and the array covertexts strings that held the Seecret",function() {
        //seecret = new SEECRET_ENGINE({ONE:"1",ZERO:"0",DELIMITER:"-",MAX_CHAIN_SEGMENT_LENGTH:40});
		seecret = new SEECRET_ENGINE({MAX_CHAIN_SEGMENT_LENGTH:40});
		var val = "chain test";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var covertexts = ["aa","bb","cc","dd","ee"];
		var chain = seecret.chainify(envelope,covertexts);
		var dechained = seecret.dechainify(chain,{withCovertexts:true});
		expect(dechained.seecret).toBeDefined();
		expect(dechained.seecret.length).toBeGreaterThan(0);
		var unhiddenSeecret = seecret.unhide(seecret.getSeecretFromEnvelope(dechained.seecret));
		expect(unhiddenSeecret).toEqual(val);
		expect(dechained.covertexts).toEqual(covertexts.slice(0,chain.length));
		
	});
	
	it("should dechainify and return the Seecret when the chain segment contains the entire Seecret",function() {
        //seecret = new SEECRET_ENGINE({ONE:"1",ZERO:"0",DELIMITER:"-",MAX_CHAIN_SEGMENT_LENGTH:4000});
		seecret = new SEECRET_ENGINE({MAX_CHAIN_SEGMENT_LENGTH:400});
		var val = "chain test";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var stegotext = seecret.stegotext(envelope,"some stegotext");
		
		var chain = [stegotext];
		chain.unshift("Some nonseecret message");
		chain.push("Some other nonseecret message");
		expect(chain.length).toEqual(3);
		
		var dechainedText = seecret.dechainify(chain);
		expect(dechainedText).toEqual(envelope);
		
		var dechained = seecret.dechainify(chain);
		expect(dechained).toBeDefined();
		
		var unhiddenSeecret = seecret.unhide(seecret.getSeecretFromEnvelope(dechained));
		expect(unhiddenSeecret).toEqual(val);
		
		
	});

	it("should dechainify and return the Seecret starting at a specific index in the chain",function() {
        //seecret = new SEECRET_ENGINE({ONE:"1",ZERO:"0",DELIMITER:"-",MAX_CHAIN_SEGMENT_LENGTH:4000});
		seecret = new SEECRET_ENGINE({MAX_CHAIN_SEGMENT_LENGTH:50});
		var val = "chain test with multiple segments hopefully?";
		var hiddenVal = seecret.hidePlainText(val);
		var envelope = seecret.envelope(hiddenVal,seecret.config.CONTENT_TYPES.PLAIN);
		var covertexts = ["aa","bb","cc","dd","ee","ff","gg","hh"];
		var chain = seecret.chainify(envelope,covertexts);
		chain.unshift("a non seecret entry");
		chain.unshift("a non seecret entry");
		chain.push("a final nonseecret entry");
		for(var i=2;i<8;i++){
			var entry = "another nonseecret entry " +i;
			chain.splice((i*2),0,entry);
			
		}
		var startIndex = seecret.getOrdinalIndex(chain,{ordinal:0});
		var dechainedSeecret = seecret.dechainify(chain,{startIndex:startIndex});
		var unhiddenSeecret = seecret.unhide(seecret.getSeecretFromEnvelope(dechainedSeecret));
		expect(unhiddenSeecret).toEqual(val);

		
	});

	
	it("Should shuffle an array", function() { 
		seecret = new SEECRET_ENGINE();
		var val = [1,2,3,4,5,6,7,8,9,10]
		var val2 = seecret.shuffleArray(val.slice(0));
		var shuffleCount=0;
		expect(val2.length).toEqual(val.length);
		for(var each in val){
			if(val2[each] != val[each]){
				shuffleCount++;
			}
		}
		expect(shuffleCount).toBeGreaterThan(0);
	});

});

