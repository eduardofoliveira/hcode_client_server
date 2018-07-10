class UserController {
    
    constructor(formIdCreate, formIdUpdate, tableId){
        this.formEl = document.getElementById(formIdCreate)
        this.formUpdateEl = document.getElementById(formIdUpdate)
        this.tableEl = document.getElementById(tableId)

        this.onSubmit()
        this.onEdit()
        this.selectAll()
    }

    onEdit(){
        document.querySelector('#box-user-update .btn-cancel').addEventListener('click', e => {
            this.showPanelCreate()
        })

        this.formUpdateEl.addEventListener('submit', event => {
            event.preventDefault()

            let btn = this.formUpdateEl.querySelector('[type=submit]')
            btn.disabled = true

            let values = this.getValues(this.formUpdateEl)

            let index = this.formUpdateEl.dataset.trIndex

            let tr = this.tableEl.rows[index]

            let userOld = JSON.parse(tr.dataset.user)

            let result = Object.assign({}, userOld, values)

            this.getPhoto(this.formUpdateEl)
                .then((content) => {

                    if(!values.photo){
                        result._photo = userOld._photo
                    }else{
                        result._photo = content
                    }

                    let user = new User()

                    user.loadFromJSON(result)

                    user.save().then(user => {

                        this.getTr(user, tr)
        
                        this.updateCount()

                        this.formUpdateEl.reset()
                        btn.disabled = false
                        this.showPanelCreate()

                    })
                    
                }, (error) => {
                    console.error(error)
                })
        })
    }

    onSubmit(){

        this.formEl.addEventListener('submit', event => {
            event.preventDefault()

            let btn = this.formEl.querySelector('[type=submit]')

            btn.disabled = true

            let values = this.getValues(this.formEl)

            if(!values){
                btn.disabled = false
                return false
            }

            this.getPhoto(this.formEl)
                .then((content) => {
                    values.photo = content

                    values.save().then(user => {
                        this.addLine(user)
                        this.formEl.reset()
                        btn.disabled = false
                    })
                }, (error) => {
                    console.error(error)
                })

        })

    }

    getPhoto(formEl){

        return new Promise((resolve, reject) => {

            let fileReader = new FileReader()

            let elements = [...formEl.elements].filter(item => {
                if(item.name === 'photo'){
                    return item
                } 
            })

            let file = elements[0].files[0]

            fileReader.onload = () => {
                resolve(fileReader.result)
            }

            fileReader.onerror = (error) => {
                reject(error)
            }

            if(file){
                fileReader.readAsDataURL(file)
            }else{
                resolve('dist/img/boxed-bg.jpg')
            }
            
        })
        
    }

    getValues(formEl){

        let user = {}
        let isValid = true

        for(let i = 0; i < formEl.elements.length; i++){
            if(['name', 'email', 'password'].indexOf(formEl.elements[i].name) > -1 && !formEl.elements[i].value){
                formEl.elements[i].parentElement.classList.add('has-error')
                isValid = false
            }

            if(formEl.elements[i].name == 'gender'){
                if(formEl.elements[i].checked){
                    user[formEl.elements[i].name] = formEl.elements[i].value
                }
            } else if(formEl.elements[i].name == 'admin'){
                user.admin = formEl.elements[i].checked
            } else{
                user[formEl.elements[i].name] = formEl.elements[i].value
            }
        }

        if(!isValid){
            return false
        }
    
        return new User(
            user.name,
            user.gender,
            user.birth,
            user.country,
            user.email,
            user.password,
            user.photo,
            user.admin
        )

    }

    

    selectAll(){

        User.getUsersStorage().then(data => {
            data.users.forEach(dataUser => {

                let user = new User()
                user.loadFromJSON(dataUser)
    
                this.addLine(user)
            })
        })

    }

    addLine(dataUser){
        
        let tr = this.getTr(dataUser)

        this.tableEl.appendChild(tr)

        this.updateCount()
        
    }

    getTr(dataUser, tr = null){

        if(!tr){
            tr = document.createElement('tr')
        }

        tr.dataset.user = JSON.stringify(dataUser)

        tr.innerHTML = `
            <td><img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm"></td>
            <td>${dataUser.name}</td>
            <td>${dataUser.email}</td>
            <td>${(dataUser.admin) ? 'Sim' : 'Não'}</td>
            <td>${Utils.dateFormat(dataUser.register)}</td>
            <td>
                <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
                <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
            </td>`

        this.addEventsTR(tr)

        return tr
    }

    addEventsTR(tr){
        tr.querySelector('.btn-delete').addEventListener('click', e =>{
            if(confirm('Deseja realmente excluir ?')){

                let user = new User()
                user.loadFromJSON(JSON.parse(tr.dataset.user))
                
                user.remove().then(data => {
                    tr.remove()
                    this.updateCount()
                })
                
            }
        })

        tr.querySelector('.btn-edit').addEventListener('click', e =>{
            let json = JSON.parse(tr.dataset.user)

            this.formUpdateEl.dataset.trIndex = tr.sectionRowIndex

            for (let name in json){
                let field = this.formUpdateEl.querySelector("[name="+name.replace('_','')+"]")

                if(field){
                    if(field.type == 'file'){
                        continue
                    }
                    switch(field.type){
                        case 'file':
                            continue
                            break
                        case 'radio':
                            field = this.formUpdateEl.querySelector("[name="+name.replace('_','')+"][value="+json[name]+"]")
                            field.checked = true
                            break
                        case 'checkbox':
                            field.checked = json[name]
                            break
                        default:
                            field.value = json[name]
                    }
                }
            }

            this.formUpdateEl.querySelector('.photo').src = json._photo

            this.showPanelUpdate()
        })
    }

    showPanelCreate(){
        document.querySelector('#box-user-update').style.display = 'none'
        document.querySelector('#box-user-create').style.display = 'block'
    }

    showPanelUpdate(){
        document.querySelector('#box-user-create').style.display = 'none'
        document.querySelector('#box-user-update').style.display = 'block'
    }

    updateCount(){

        let numberUsers = 0
        let numberAdmin = 0;

        [...this.tableEl.children].forEach(tr => {
            numberUsers++

            let user = JSON.parse(tr.dataset.user)

            if(user._admin){
                numberAdmin++
            }
        })

        document.querySelector('#number-users').innerHTML = numberUsers
        document.querySelector('#number-users-admin').innerHTML = numberAdmin
    }

}