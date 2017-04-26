import mainTemplate from './src/templates/main.html!text'
import Handlebars from 'handlebars'
import rp from 'request-promise'

export function render() {
    return rp({
        uri: 'https://interactive.guim.co.uk/docsdata-test/1go6G6GaD6--5cAAPQxeO3ga1bHSwSsiuxM92l244-rQ.json',
        json: true
    }).then((data) => {
        var sheets = data.sheets;
        var content = Handlebars.compile(
                        mainTemplate,
                        { compat: true }
                );
        return content(sheets);
    });
}
