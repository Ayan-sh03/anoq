using extension auth;
module default {
    type User  {
        required email: str { constraint exclusive; };
        username : str {constraint  exclusive};
        family_name : str;
        given_name : str;
    }
    type Form extending ext::auth::Auditable{
        required title: str;
        author : User;
        required description:str{
            default:=""
        };
        required slug: str{constraint exclusive};
        multi question:Question;    
        multi choiceQuestion:MultipleChoiceQuestion;  
    }

    type Filled_Form extending ext::auth::Auditable{
         form : Form;
         name : str;
         email :str {constraint exclusive};
         multi question:Question;
         multi choiceQuestion:MultipleChoiceQuestion;
         userIp : str;    
    }

     type Question{
        required question_text:str;
        answer:str;
    }
    type  MultipleChoiceQuestion extending Question{
        multi choices:str;
        multi selectedChoice : str;
    }

}
