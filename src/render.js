import mainTemplate from './src/templates/main.html!text'
import Handlebars from 'handlebars'
import rp from 'request-promise'

export function render() {
    return rp({
        uri: 'https://interactive.guim.co.uk/docsdata-test/1li4b1KQ33q9mZKJSU0c6vgD35EoDA8c5m5LYOZ4gVr8.json',
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
