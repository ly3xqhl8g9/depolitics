// Ben Alman's replaceText plugin
// http://www.benalman.com/projects/jquery-replacetext-plugin/
$.fn.replaceText = function(search, replace, text_only) {
    return this.each(function(){
        var node = this.firstChild,
            val,
            new_val,
            remove = [];
        if ( node ) {
            do {
                if ( node.nodeType === 3 ) {
                    val = node.nodeValue;
                    new_val = val.replace( search, replace );
                    if ( new_val !== val ) {
                        if ( !text_only && /</.test( new_val ) ) {
                            $(node).before( new_val );
                            remove.push( node );
                        } else {
                            node.nodeValue = new_val;
                        }
                    }
                }
            } while ( node = node.nextSibling );
        }
        remove.length && $(remove).remove();
    });
};


// pick the first cluster
// find names in the first cluster
// make a set of names in the first cluster
// make intersection of names in set with names in database
// with the result change names on the web page
// pick the second cluster
// find names in the second cluster
// make set of names in the second cluster
// determine what is in the second set and not in the first set
// with the second set make intersection with database 


function replaceText(database) {
    // console.log(database);
    let bodyText = textClusterIterator(extractText())

    let possiblePeople = new Set();

    let timeStart = new Date();
    // console.log("start");

    let cluster = bodyText.next().value;
    // console.log("cluster", cluster);

    let peopleCluster = nlp(cluster).people().normalize().out('text');
    peopleCluster = new Set(peopleCluster.split(" "));
    let newPeople = new Set([...peopleCluster].filter(x => !possiblePeople.has(x)));
    possiblePeople = new Set([...possiblePeople, ...peopleCluster]);

    // console.log("peopleCluster", peopleCluster);
    // console.log("newPeople", newPeople);
    // console.log("possiblePeople", possiblePeople);
    replaceNames(newPeople, database);

    let timeEnd = new Date();
    // console.log(timeEnd - timeStart);





    // let timeStart = new Date();
    // console.log("start LOOP");

    // for (let cluster of bodyText) {
    //     // let cluster = bodyText.next().value;
    //     let timeStart = new Date();
    //     console.log("start");
    //     // console.log(cluster);

    //     let peopleCluster = nlp(cluster).people().normalize().out('text');
    //     peopleCluster = new Set(peopleCluster.split(" "));
    //     let newPeople = new Set([...peopleCluster].filter(x => !possiblePeople.has(x)));
    //     possiblePeople = new Set([...possiblePeople, ...peopleCluster]);

    //     console.log("peopleCluster", peopleCluster);
    //     console.log("newPeople", newPeople);
    //     console.log("possiblePeople", possiblePeople);
    //     replaceNames(newPeople, database);

    //     let timeEnd = new Date();
    //     console.log(timeEnd - timeStart);
    //     console.log("end");
    // }

    // let timeEnd = new Date();
    // console.log(timeEnd - timeStart);
    // console.log("end LOOP");
}


function replaceNames(text, database) {
    // console.log("array of text", text);
    // console.log("database", database);
    // console.log("HERE");

    let textSet = new Set(text);
    // console.log("text set", textSet);

    let databaseLastNames = new Set();
    for (let i=0; i < database.length; i++) {
        databaseLastNames.add(database[i]["last_name"]);
        // console.log("h");
    }
    // console.log(databaseLastNames);

    let textDatabaseIntersection = new Set([...textSet].filter(x => databaseLastNames.has(x)));
    // console.log("intersection", textDatabaseIntersection);

    for(let politicianLastName of textDatabaseIntersection) {
        // console.log(politicianLastName);
        for (let i=0; i < database.length; i++) {
            if (database[i]["last_name"] == politicianLastName) {
                let identificationString = database[i]["identification_string"];
                let firstName = database[i]["first_name"];
                let lastName = database[i]["last_name"];
                let currentFunction = database[i]["current_function"];
                let previousFunctions = database[i]["previous_functions"];
                let name_variants = database[i]["name_variants"];
                let identificationSpan = `<span class="depolitics-is">${identificationString}
                                            <span class="depolitics-card">
                                                <p>current function<br><i>${currentFunction}</i></p>
                                                <p>previous functions<br><i>${previousFunctions}</i></p>
                                                <p>
                                                    <span class="depolitics-wiki"><a target="_blank" href="https://en.wikipedia.org/wiki/${firstName}_${lastName}">wiki</a></span>
                                                    <span class="depolitics-identity">
                                                        <span class="depolitics-identity-text">identity</span>
                                                        <span class="depolitics-identity-show"></span>
                                                    </span>
                                                </p>
                                            </span>
                                          </span>`;

                if (name_variants) {
                    // console.log("a", name_variants)
                    name_variants = name_variants.split(",").map(item => item.trim());
                    // console.log("b", name_variants)
                }
                // console.log(name_variants);

                // BUG with exceeding stack
                for (let k=0; k < name_variants.length; k++) {
                    $("*").replaceText(name_variants[k], identificationSpan);
                    // console.log("a");
                }
                
                let politicianFullName = `${firstName} ${lastName}`;
                $("*").replaceText(politicianFullName, identificationSpan);
                // console.log("b");

                $("*").replaceText(politicianLastName, identificationSpan);            
                // console.log("c");
            }
        }
    }

    setEventsListeners()
}


function setEventsListeners() {
    let depoliticsIsSpans = document.getElementsByClassName("depolitics-is");

    for (let i = 0; i < depoliticsIsSpans.length; i++) {
        depoliticsIsSpans[i].addEventListener("mouseenter", (event) => {
            depoliticsIsSpans[i].children[0].style.display = "block"
        });

        depoliticsIsSpans[i].addEventListener("mouseleave", (event) => {
            depoliticsIsSpans[i].children[0].style.display = "none"
        });
    }


    let depoliticsIdentitySpans = document.getElementsByClassName("depolitics-identity");

    for (let i = 0; i < depoliticsIdentitySpans.length; i++) {
        depoliticsIdentitySpans[i].addEventListener("click", (event) => {
            event.preventDefault();
            
            depoliticsIdentitySpans[i].children[0].style.display = "none";
            depoliticsIdentitySpans[i].children[1].style.display = "block";
            let politicianName = depoliticsIdentitySpans[i].parentElement.children[0].children[0].href
            let regExp = /\/(\w+)_(\w+)/;
            let firstName = politicianName.match(regExp)[1];
            let lastName = politicianName.match(regExp)[2];

            depoliticsIdentitySpans[i].children[1].innerText = `${firstName} ${lastName}`;
            
            setTimeout(function() { 
                depoliticsIdentitySpans[i].children[0].style.display = "block";
                depoliticsIdentitySpans[i].children[1].style.display = "none";
            }, 2000);
        });
    }
}
