import { ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { itemSaveData } from 'src/app/core/models/itemSaveData';
import { shoppingListSaveData } from 'src/app/core/models/shoppingListSaveData';
import { FirebaseService } from 'src/app/core/services/firebase.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SavedialogComponent } from 'src/app/shoppinglist/components/savedialog/savedialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PoeService } from 'src/app/core/services/poe.service';
import { SimpleDataService } from 'src/app/core/services/simpledata.service';
import { simpleData } from 'src/app/core/models/simpleData';
import { ItemForm } from 'src/app/core/classes/itemform';

@Component({
  selector: 'app-shoppinglist',
  templateUrl: './shoppinglist.component.html',
  styleUrls: ['./shoppinglist.component.scss']
})
export class ShoppinglistComponent implements OnInit {

  @ViewChildren("shoppingListNameInput") shoppingListNameInput: QueryList<ElementRef>;            //Item name input element
  
  public listLoading: boolean;                                      //If the shopping list is loading data from firebase
  public poeLoading: boolean;                                       //If the poe api data is loading
  public leagues: Array<simpleData> = [];                           //Used for iterating over leaguess
  public editShoppingListName: boolean = false;                     //Whether the shopping list input is disabled or not
  public items: Array<ItemForm> = [];                               //Stores ItemForms

  public errMsg: string;                                            //Error Message to display

  public shoppingList = new FormGroup({                             //Shopping list base inputs
    league: new FormControl(),
    name: new FormControl('Your Shopping List')
  });

  constructor(private cd: ChangeDetectorRef, 
              private poeAPI: PoeService, 
              private fireService: FirebaseService,
              private activeRoute: ActivatedRoute,
              private dialog: MatDialog,
              private snackBar: MatSnackBar,
              public simpleDataService: SimpleDataService) { 

    
    let poeAPILoad = this.poeAPI.loaded.subscribe(
      (loaded) => {
        this.poeLoading = !loaded;

        if (loaded) {
          this.leagues = this.poeAPI.getLeagues();
          poeAPILoad.unsubscribe();

          if (this.shoppingList.controls.league.value == null) {
            this.shoppingList.controls.league.patchValue(this.leagues[0].id);
          }
        }
      },
      (error) => {
        this.errMsg = error;
      }
    );

    let queryParam = this.activeRoute.snapshot.queryParamMap.get('list');

    if (queryParam) {
      this.load(queryParam);
    } else {
      this.addItem();
    }
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.shoppingListNameInput.changes.subscribe(() => {        //focus name input element after processed by ngIf
      
      if (this.editShoppingListName) {
        this.shoppingListNameInput.first.nativeElement.focus();
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Adds a new Item to the shopping list
   * 
   * @param itemSaveData 
   *        Saved data to initiate the new item with
   */
  public addItem(itemSaveData?: itemSaveData) {
    let item: ItemForm = new ItemForm(itemSaveData);
    this.items.push(item);
  }

  /**
   * Deletes an item
   * 
   * @param itemData 
   *        Item to delete
   */
  public deleteItem(itemData: ItemForm) {
    this.items.splice(this.items.indexOf(itemData), 1);
  }

  /**
   * Saves the shopping list to firebase
   */
  public save() {
    this.dialog.open(SavedialogComponent, {
      panelClass: 'save-dialog',
      disableClose: true,
      data: this.fireService.addShoppingList(this.configureShoppingListData())
    });
  }

  /**
   * Configures the shopping list properties into savable data
   */
  public configureShoppingListData(): shoppingListSaveData {
    let save: shoppingListSaveData = {        //Main save object
      name: this.shoppingList.value.name,
      league: this.shoppingList.value.league,
      savedItems: []
    }

    this.items.forEach(item => {              //Add items 
      save.savedItems.push(item.itemForm.getRawValue());
    });

    return save;
  }

  /**
   * Loads a shopping list configuration
   * 
   * @param list 
   *        id of the shopping list document
   */
  public load(list: string) {
    this.listLoading = true;          //Set loading to true

    this.fireService.getShoppingList(list).then(doc => {      //Try to get the document
      
      if (doc.exists) {
        (doc.data() as shoppingListSaveData).savedItems.forEach((save: itemSaveData) => {   //Add items
          this.addItem(save);
        });

        //Set league and name
        this.shoppingList.controls.name.patchValue((doc.data() as shoppingListSaveData).name);
        this.shoppingList.controls.league.patchValue((doc.data() as shoppingListSaveData).league);

      } else {  //Doc doesn't exist
        this.displayErrorSnackBar('Error: No such list exists!');
        this.addItem();
      }

      this.listLoading = false;
    }).catch(() => {      //Err while trying to read the doc     
      this.displayErrorSnackBar('Error: Could not load the list');
      this.addItem();
      this.listLoading = false;
    })
  }

  /**
   * Displays an err through a snackbar
   * 
   * @param err 
   *        string: error message
   */
  public displayErrorSnackBar(err: string) {
    this.snackBar.open(err, 'close', {
      panelClass: 'error-snack-bar',
      duration: 3000
    })
  }
}