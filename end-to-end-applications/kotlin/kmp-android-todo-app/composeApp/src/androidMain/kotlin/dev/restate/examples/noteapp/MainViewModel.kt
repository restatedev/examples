package dev.restate.examples.noteapp

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.async
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

class MainViewModel(
  private val client: TodosClient,
  private val dispatcher: CoroutineDispatcher
) : ViewModel() {

  private val updateSignal = Channel<Unit>()

  val todos: Flow<List<TodoItem>> = updateSignal.receiveAsFlow().map {
      getTodos().await()
  }

  init {
    // Trigger first reload
    viewModelScope.launch(dispatcher) {
      triggerTodosReload()
    }
  }

  fun addTodo(todo: String) =
    viewModelScope.launch(dispatcher) {
      client.add(TodoItem(content = todo))
      triggerTodosReload()
    }

  fun toggleTodo(todoItem: TodoItem) =
    viewModelScope.launch(dispatcher) {
      client.markCompleted(todoItem.id)
      triggerTodosReload()
    }

  fun removeTodo(todoItem: TodoItem) =
    viewModelScope.launch(dispatcher) {
      client.remove(todoItem.id)
      triggerTodosReload()
    }

  private fun getTodos() =
    viewModelScope.async(dispatcher) { this@MainViewModel.client.readAll() }

  private suspend fun triggerTodosReload() {
    updateSignal.send(Unit)
  }

}