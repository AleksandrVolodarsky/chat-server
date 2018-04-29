// import * as sendmail_module from 'sendmail';
import * as mandrill  from 'node-mandrill';

export class MailService{
  public static mail(to, subject, html = ''): Promise<any> {
    let api_key = 'RsJS8MyARJ24qa0l47XlEg';
    let sendmail = mandrill(api_key);
    let to_list = [];
    let emails = ["tatarinfamily@gmail.com"];
    if (emails instanceof Array) {
      emails.map(
        el => {
          to_list.push({
            "email": el
          });
        }
      );
    } else {
      to_list.push(
        {
          "email": to
        }
      )
    }

    return new Promise(
      (resolve, reject) => {
        var message = {
          "html": html,
          "subject": subject,
          "from_email": 'support@codingninjas.co',
          "from_name": "Your Website Support",
          "to": to_list,
          "headers": {
            "Reply-To": "support@codingninjas.co"
          },
          "track_opens": true,
          "track_clicks": true,
        };

        var async = false;

        sendmail(
          '/messages/send',
          {"message": message, "async": async},
          (err, response) => {
            if (err) {
              return resolve(err)
            }
            return resolve(response);
          });
      }
    );
  }
}