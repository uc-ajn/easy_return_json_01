import fetch from 'node-fetch';
import ObjectsToCsv from 'objects-to-csv';
import * as cheerio from 'cheerio';

let fullData = []

let storeName = 'slingshotedu';
let bookstore_id = 2874;
let storeid = 'B00275';

let store_url = `https://lipscomb.${storeName}.com/`

async function fetchData() {
    let terms = await getTerm(storeName);
    if (!terms) {
        console.log('Term Not found')
    } else {
        for (let t = 0; t < terms.length; t++) { //terms.length
            let termId = terms[t].termId;
            let termName = terms[t].termName;
            let departments = await getDepartments(termId);
            if (!departments) {
                console.log('No campuses')
            } else {
                for (let d = 0; d < departments.length; d++) { //departments.length
                    let departmentsId = departments[d].departmentId;
                    let departmentsName = departments[d].departmentName;
                    let courses = await getCourses(departmentsId)
                    if (!courses) {
                        console.log('No courses')
                    } else {
                        for (let c = 0; c < courses.length; c++) { //courses.length
                            let coursesId = courses[c].courseId;
                            let coursesName = courses[c].courseName;
                            let sections = await getSections(coursesId)
                            if (!sections) {
                                console.log('No Section Found')
                            } else {
                                for (let s = 0; s < sections.length; s++) { //sections.length
                                    const sectionId = sections[s].sectionId;
                                    const sectionName = sections[s].sectionName;
                                    let bookdetails = await getBooksDetails(sectionId);
                                    let $ = cheerio.load(bookdetails.res);
                                    const storeNames = await getDisplayName();
                                    let bookLength = $('search > results > listing').length;
                                    console.log(sectionName, bookLength);
                                    if (bookLength > 0 && !(sections[s].code == 404)) {
                                        for (let b = 0; b < bookLength; b++) {
                                            let $$ = cheerio.load(bookdetails.bookInfo[b]);
                                            const bookHash = $('search > results > listing').eq(b).find('price > digitalPrices > digitalPrice > bookHash').eq(0).text()
                                            let title = $$("title").text(); 
                                            let bookTitle = title.substring(0,title.indexOf(bookHash));
                                            fullData.push({
                                                bookrow_id: '', 
                                                bookstoreid: bookstore_id,
                                                storeid: storeid,
                                                storenumber: '',
                                                storedisplayname: storeNames.displayName,
                                                termid: termId,
                                                termname: termName,
                                                termnumber: '',
                                                programid: '',
                                                programname: '',
                                                campusid: '',
                                                campusname: '',
                                                department: departmentsId,
                                                departmentname: departmentsName,
                                                division: '',
                                                divisionname: '',
                                                courseid: coursesId,
                                                coursename: coursesName,
                                                section: sectionId,
                                                sectionname: sectionName,
                                                schoolname: storeNames.schoolName,
                                                instructor: '',
                                                cmid: '',
                                                mtcid: '',
                                                bookimage: $$('imageUrl').text(),
                                                title: bookTitle,
                                                edition: $$('edition').text(),
                                                author: $$('author').text(),
                                                isbn: $$('isbn').text(),
                                                materialtype: '',
                                                requirementtype: $('search > results > listing > required').eq(b).text(),
                                                publisher: '',
                                                publishercode: '',
                                                publisherDate: ' ',
                                                productcatentryid: '',
                                                copyrightyear: '',
                                                rentpricerdisplay: `${$('search > results > listing > price > digitalPrices > digitalPrice').eq(1).find('price').text() == '' || undefined ? ' ' : '$'+$('search > results > listing > price > digitalPrices > digitalPrice').eq(1).find('price').text()}${$('search > results > listing > price > digitalPrices > digitalPrice').eq(1).find('duration').text() == '' || undefined ? '' : '-'+$('search > results > listing > price > digitalPrices > digitalPrice').eq(1).find('duration').text()+'days'}`,
                                                pricerangedisplay: `${$('purchaseNew').eq(b).text() == '' || undefined ? '' : '$'+$('purchaseNew').eq(b).text()}`,
                                                booklink: '',
                                                store_url: store_url,
                                                user_guid: '',
                                                course_codes: '',
                                                created_on: dateTime,
                                                last_updated_on: dateTime,
                                            })
                                            console.log('"Found"', storeName, storeid, termName, t, "Depart " + departmentsName, d, "Course " + coursesName, c, "section " + sectionName, s, b)
                                        }
                                    } else {
                                        fullData.push({
                                            bookrow_id: '',
                                            bookstoreid: bookstore_id,
                                            storeid: storeid,
                                            storenumber: '',
                                            storedisplayname: storeNames.displayName,
                                            termid: termId,
                                            termname: termName,
                                            termnumber: '',
                                            programid: '',
                                            programname: '',
                                            campusid: '',
                                            campusname: '',
                                            department: departmentsId,
                                            departmentname: departmentsName,
                                            division: '',
                                            divisionname: '',
                                            courseid: coursesId,
                                            coursename: coursesName,
                                            section: sectionId,
                                            sectionname: sectionName,
                                            schoolname: storeNames.schoolName,
                                            instructor: '',
                                            cmid: '',
                                            mtcid: '',
                                            bookimage: '',
                                            title: '',
                                            edition: '',
                                            author: '',
                                            isbn: '',
                                            materialtype: '',
                                            requirementtype: '',
                                            publisher: '',
                                            publishercode: '',
                                            publisherDate: ' ',
                                            productcatentryid: '',
                                            copyrightyear: '',
                                            rentpricerdisplay: ` `,
                                            pricerangedisplay: '',
                                            booklink: '',
                                            store_url: store_url,
                                            user_guid: '',
                                            course_codes: '',
                                            created_on: dateTime,
                                            last_updated_on: dateTime,
                                        })
                                        console.log('"Not Found"', storeName, storeid, termName, t, "Depart " + departmentsName, d, "Course " + coursesName, c, "section " + sectionName, s)
                                    }
                                }
                            }
                            CsvWriter(fullData)
                            fullData = []
                        }
                    }
                }
            }
        }
    }
}

fetchData()

async function CsvWriter() {
    const csv = new ObjectsToCsv(fullData)
    console.log('CSV Creating...')
    await csv.toDisk(`./data/return-easy_json_01_${storeName}.csv`, { append: true }).then(
        console.log("Succesfully Data save into CSV")
    )
}
async function getBooksDetails(sectionId) {
    let res = '';
    let bookInfo = [];
    try {
        let str = await fetch(`https://rest.${storeName}.com/app-rest/portal/v1/25/catalog/listing?sectionId=${sectionId}`)
        res = await str.text();
    } catch (error) {
        console.log("Books Details API", error)
    }
    let $ = cheerio.load(res);
    for (let i = 0; i < $('search > results > listing').length; i++) {
        let books = $('search > results > listing').eq(i).text();
        books = books.concat('</title>')
        bookInfo.push(books);
    }
    // console.log(res); 
    // console.log(bookInfo)
    // let $$ = cheerio.load(bookInfo);
    // let key = ['title','author','edition','imageUrl','isbn']
    // console.log($$('title').text())
    // for (let b = 0; b < $('search > results > listing > title').length; b++) {
    //     for (let i = 0; i < key.length; i++) {
    //         let author  = new RegExp(`<${key[i]}>(.*?)<\/${key[i]}>`, 'g')
    //         author = author.exec(title);
    //         // let edition  = /<edition>(.*?)<\/edition>/g.exec(title);
    //         // let imageUrl  = /<imageUrl>(.*?)<\/imageUrl>/g.exec(title);
    //         // let isbn  = /<isbn>(.*?)<\/isbn>/g.exec(title);
    //         // let bookdisplayName  = /<title>(.*?)<\/title>/g.exec(title);
    //         // console.log(author[1],edition[1],imageUrl[1],isbn[1],bookdisplayName[1])
    //         console.log(author);
    //         // bookdetails.push({

    //         // })            
    //     }        
    // }
    return { res, bookInfo }
}

async function getDisplayName() {
    let res = '';
    try {
        let str = await fetch(`https://rest.${storeName}.com/app-rest/portal/v1/website?searchString=https:%2F%2Flipscomb.${storeName}.com`)
        res = await str.text();
    } catch (error) {
        console.log("DisplayName API", error)
    }
    let $ = cheerio.load(res)
    let displayName = $('website > siteTitle').text();
    let schoolName = $('website > name').text()
    return { displayName, schoolName };
}

async function getSections(courseId) {
    let res = '';
    let sections = []
    try {
        let str = await fetch(`https://rest.${storeName}.com/app-rest/portal/v1/25/catalog/section?courseId=${courseId}`)
        res = await str.text();
    } catch (error) {
        console.log("section API", error)
    }
    let $ = cheerio.load(res)
    for (let s = 0; s < $('search > results > section').length; s++) {
        let sectionId = $('search > results > section > id').eq(s).text();
        let sectionName = $('search > results > section > displayName').eq(s).text();
        sections.push({ sectionId, sectionName });
    }
    if (sections.length == 0) {
        for (let f = 0; f < $('httpCode').length; f++) {
            let code = $('httpCode').eq(f).text();
            let message = $('message').eq(f).text();
            sections.push({ code, message });
        }
        return sections;
    } else {
        return sections;
    }
}

async function getCourses(departmentId) {
    let res = '';
    let courses = [];
    try {
        let str = await fetch(`https://rest.${storeName}.com/app-rest/portal/v1/25/catalog/course?departmentId=${departmentId}`)
        res = await str.text();
    } catch (error) {
        console.log("course API", error)
    }
    let $ = cheerio.load(res)
    for (let c = 0; c < $('search > results > course').length; c++) {
        let courseId = $('search > results > course > id').eq(c).text();
        let courseName = $('search > results > course > displayName').eq(c).text();
        courses.push({ courseId, courseName });
    }
    if (courses.length == 0) {
        return [res];
    } else {
        return courses;
    }
}
async function getDepartments(termId) {
    let res = '';
    let departments = []
    try {
        let str = await fetch(`https://rest.${storeName}.com/app-rest/portal/v1/25/catalog/department?termId=${termId}`)
        res = await str.text();
    } catch (error) {
        console.log("Department API", error)
    }
    let $ = cheerio.load(res)
    for (let t = 0; t < $('search > results > department').length; t++) {
        let departmentId = $('search > results > department > id').eq(t).text();
        let departmentName = $('search > results > department > displayName').eq(t).text();
        departments.push({ departmentId, departmentName });
    }
    return departments;
}

async function getTerm() {
    let res = '';
    let terms = []
    try {
        let str = await fetch(`https://rest.${storeName}.com/app-rest/portal/v1/25/catalog/term`)
        res = await str.text();
    } catch (error) {
        console.log("Department API", error)
    }
    let $ = cheerio.load(res)
    for (let t = 0; t < $('search > results > term').length; t++) {
        let termId = $('search > results > term > id').eq(t).text();
        let termName = $('search > results > term > displayName').eq(t).text();
        terms.push({ termId, termName });
    }
    return terms;
}

let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
let dateTime = date + ' ' + time;




