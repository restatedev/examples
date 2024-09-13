package dev.restate.examples.noteapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import dev.restate.examples.noteapp.composables.TodoItemsContainer
import dev.restate.examples.noteapp.composables.TodoInputBar
import dev.restate.examples.noteapp.ui.constants.OverlappingHeight
import io.ktor.http.Url
import kotlinx.coroutines.Dispatchers

// Thanks to https://medium.com/deuk/intermediate-android-compose-todo-app-ui-1d808ef7882d for the Compose UI related code.

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val mainViewModel = MainViewModel(TodosClient(Url("http://localhost:8080")), dispatcher = Dispatchers.IO)
        setContent {
            Box(
                modifier = Modifier.fillMaxSize()
            ) {
                TodoItemsContainer(
                    todoItemsFlow = mainViewModel.todos,
                    onItemClick = mainViewModel::toggleTodo,
                    onItemDelete = mainViewModel::removeTodo,
                    overlappingElementsHeight = OverlappingHeight
                )
                TodoInputBar(
                    modifier = Modifier.align(Alignment.BottomStart),
                    onAddButtonClick = mainViewModel::addTodo
                )
            }
        }
    }
}