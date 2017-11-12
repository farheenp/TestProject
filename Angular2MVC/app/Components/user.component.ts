import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../Service/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { IUser } from '../Model/user';
import { userItem } from '../Model/UserItem';
import { shoppingCart } from '../Model/shoppingCart';

import { DBOperation } from '../Shared/enum';
import { Observable } from 'rxjs/Rx';
import { Global } from '../Shared/global';

@Component({
    templateUrl: 'app/Components/user.component.html'
})

export class UserComponent implements OnInit {

    @ViewChild('modal') modal: ModalComponent;
    users: IUser[];
    selectedUsers: IUser[]= [];
    user: IUser;
    msg: string;
    indLoading: boolean = false;
    userFrm: FormGroup;
    dbops: DBOperation;
    modalTitle: string;
    modalBtnTitle: string;
    listFilter: string;
    searchTitle: string = "Search User";
    currentShoppingCart: shoppingCart;

    constructor(private fb: FormBuilder, private _userService: UserService) { }

    ngOnInit(): void {
        this.userFrm = this.fb.group({
            Id: [''],
            FirstName: ['', Validators.required],
            LastName: [''],
            Gender: ['', Validators.required]
        });
        this.LoadUsers();
        this.LoadShoppingCart();
    }

    checkboxChanged(userIdString: string)

    {
        var userId = parseInt(userIdString);
        for (var i = 0; i < this.selectedUsers.length; i++)
        { // delete selected userlist
            if (this.selectedUsers[i].Id == userId)
            {
                this.selectedUsers.splice(i, 1);
                return;
            }
            

        }
        //  if users is not in selected userlist
       
    var currentSelectedUser = this.findUserById(userId);
    if (currentSelectedUser != null) {
        this.selectedUsers.push(currentSelectedUser);
    }

    }

    findUserById(userId: number)
    {
        for (var i = 0; i < this.users.length; i++)
        {
            if (this.users[i].Id == userId)
            {
                return this.users[i];
            }
        }
        return null;
    }

    LoadShoppingCart()
    {

        var selectedItemList = this.convertUserListToUserItemList(this.selectedUsers);
    }
    LoadUsers(): void {
        this.indLoading = true;
        this._userService.get(Global.BASE_USER_ENDPOINT)
            .subscribe(users => { this.users = users; this.indLoading = false; },
            error => this.msg = <any>error);
    }

    addUser() {
        this.dbops = DBOperation.create;
        this.SetControlsState(true);
        this.modalTitle = "Add New User";
        this.modalBtnTitle = "Add";
        this.userFrm.reset();
        this.modal.open();
    }
    purchaseItems()
    {
        // current users is already login, we retrive currentUserId first
        var currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
        var selectedItemList = this.convertUserListToUserItemList(this.selectedUsers);
        // check if this user has a shopping cart already?
        this.currentShoppingCart = JSON.parse(localStorage.getItem("currentShoppingcart" + currentUser.Id));
        if (this.currentShoppingCart == null)
        {
            this.currentShoppingCart = new shoppingCart();
            this.currentShoppingCart.userId = currentUser.Id;
            this.currentShoppingCart.userItemList = selectedItemList;
        }
        else 
        {
            this.currentShoppingCart.userItemList = this.mergeItemList(this.currentShoppingCart.userItemList, selectedItemList);
            //this.currentShoppingCart
        }
        localStorage.setItem("currentShoppingcart" + currentUser.Id, JSON.stringify(this.currentShoppingCart));

    }

    convertUserListToUserItemList(selectesUsers: IUser[])
    {
        var userItemlist: userItem[]= [];

        for (var i = 0; i < selectesUsers.length; i++)
        {
            var tempUserItem = new userItem();
            tempUserItem.Quantity = 1;
            tempUserItem.user = selectesUsers[i];
            tempUserItem.subTotal = 10.00 * tempUserItem.Quantity;
            userItemlist.push(tempUserItem);
        }
        return userItemlist;
    }
    mergeItemList(existingItems: userItem[], newItemList: userItem[])
    {
        var matchingFlag = false;
        for (var i = 0; i < existingItems.length; i++)
        {
            var currentItem = existingItems[i];
            matchingFlag = false;
            for (var j = 0; j < newItemList.length; j++)
            {
                if (currentItem.user.Id == newItemList[j].user.Id)
                {
                    matchingFlag = true;
                    // new items are duplicated with existing Item
                    newItemList[j].Quantity = currentItem.Quantity + newItemList[j].Quantity;
                    break;

                }
                
            }
            // end  of the loop, find existing item index=i; does not match any newItems

            if (!matchingFlag)
            {
                newItemList.push(currentItem);
            }
        }
        return newItemList;
    }

    editUser(id: number) {
        this.dbops = DBOperation.update;
        this.SetControlsState(true);
        this.modalTitle = "Edit User";
        this.modalBtnTitle = "Update";
        this.user = this.users.filter(x => x.Id == id)[0];
        this.userFrm.setValue(this.user);
        this.modal.open();
    }

    deleteUser(id: number) {
        this.dbops = DBOperation.delete;
        this.SetControlsState(false);
        this.modalTitle = "Confirm to Delete?";
        this.modalBtnTitle = "Delete";
        this.user = this.users.filter(x => x.Id == id)[0];
        this.userFrm.setValue(this.user);
        this.modal.open();
    }

    onSubmit(formData: any) {
        this.msg = "";
   
        switch (this.dbops) {
            case DBOperation.create:
                this._userService.post(Global.BASE_USER_ENDPOINT, formData._value).subscribe(
                    data => {
                        if (data == 1) //Success
                        {
                            this.msg = "Data successfully added.";
                            this.LoadUsers();
                        }
                        else
                        {
                            this.msg = "There is some issue in saving records, please contact to system administrator!"
                        }
                        
                        this.modal.dismiss();
                    },
                    error => {
                      this.msg = error;
                    }
                );
                break;
            case DBOperation.update:
                this._userService.put(Global.BASE_USER_ENDPOINT, formData._value.Id, formData._value).subscribe(
                    data => {
                        if (data == 1) //Success
                        {
                            this.msg = "Data successfully updated.";
                            this.LoadUsers();
                        }
                        else {
                            this.msg = "There is some issue in saving records, please contact to system administrator!"
                        }

                        this.modal.dismiss();
                    },
                    error => {
                        this.msg = error;
                    }
                );
                break;
            case DBOperation.delete:
                this._userService.delete(Global.BASE_USER_ENDPOINT, formData._value.Id).subscribe(
                    data => {
                        if (data == 1) //Success
                        {
                            this.msg = "Data successfully deleted.";
                            this.LoadUsers();
                        }
                        else {
                            this.msg = "There is some issue in saving records, please contact to system administrator!"
                        }

                        this.modal.dismiss();
                    },
                    error => {
                        this.msg = error;
                    }
                );
                break;

        }
    }

    SetControlsState(isEnable: boolean)
    {
        isEnable ? this.userFrm.enable() : this.userFrm.disable();
    }
    criteriaChange(value: string): void {
        if (value != '[object Event]')
            this.listFilter = value;
    }
}