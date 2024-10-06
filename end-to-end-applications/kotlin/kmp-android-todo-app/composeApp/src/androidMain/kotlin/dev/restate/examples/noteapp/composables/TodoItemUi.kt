package dev.restate.examples.noteapp.composables

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ripple.rememberRipple
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import dev.restate.examples.noteapp.TodoItem
import dev.restate.examples.noteapp.ui.constants.LargeDp
import dev.restate.examples.noteapp.ui.constants.MediumDp
import dev.restate.examples.noteapp.ui.constants.TodoItemActionButtonRippleRadius
import dev.restate.examples.noteapp.ui.constants.TodoItemBackgroundColor
import dev.restate.examples.noteapp.ui.constants.TodoItemHeight
import dev.restate.examples.noteapp.ui.constants.TodoItemIconColor
import dev.restate.examples.noteapp.ui.constants.TodoItemIconSize
import dev.restate.examples.noteapp.ui.constants.TodoItemTextColor
import dev.restate.examples.noteapp.ui.constants.TodoItemTitleTextStyle
import dev.restate.examples.noteapp.R

@Composable
fun TodoItemUi(
    todoItem: TodoItem = TodoItem(content = "Todo Item"),
    //  1. Lambda Function Parameters for Flexibility
    onItemClick: (TodoItem) -> Unit = {},
    onItemDelete: (TodoItem) -> Unit = {}
) {
    // 2. Adaptive Color Scheme
    val backgroundColor = if (todoItem.isCompleted) TodoItemBackgroundColor.copy(alpha = 0.5f) else TodoItemBackgroundColor
    val textColor = if (todoItem.isCompleted) TodoItemTextColor.copy(alpha = 0.5f) else TodoItemTextColor

    // 3. Text Decoration
    val textDecoration = if (todoItem.isCompleted) TextDecoration.LineThrough else null

    // 4. Dynamic Icons
    val iconId = if (todoItem.isCompleted) R.drawable.ic_selected_check_box else R.drawable.ic_empty_check_box
    val iconColorFilter = if (todoItem.isCompleted) ColorFilter.tint(TodoItemIconColor.copy(alpha = 0.5f)) else ColorFilter.tint(
        TodoItemIconColor
    )
    val iconTintColor = if (todoItem.isCompleted) TodoItemIconColor.copy(alpha = 0.5f) else TodoItemIconColor

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(TodoItemHeight),
        elevation = CardDefaults.cardElevation(defaultElevation = LargeDp),
        shape = RoundedCornerShape(size = MediumDp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .background(backgroundColor)
                // 5. Clickable Modifier with Ripple Effect:
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = rememberRipple(bounded = true)
                ) { onItemClick(todoItem) },
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Image(
                painter = painterResource(id = iconId),
                contentDescription = null,
                modifier = Modifier
                    .padding(MediumDp)
                    .size(TodoItemIconSize),
                colorFilter = iconColorFilter
            )
            Text(
                text = todoItem.content,
                modifier = Modifier.weight(1f),
                style = TodoItemTitleTextStyle.copy(color = textColor),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                textDecoration = textDecoration
            )
            // 6. IconButton for Deletion
            IconButton(
                onClick = { onItemDelete(todoItem) },
                modifier = Modifier.size(TodoItemActionButtonRippleRadius)
            ) {
                Icon(
                    modifier = Modifier.size(TodoItemIconSize),
                    painter = painterResource(id = R.drawable.ic_delete),
                    contentDescription = null,
                    tint = iconTintColor
                )
            }
        }
    }
}

@Preview
@Composable
fun TodoItemUiPreview() {
    Column(
        modifier = Modifier.padding(MediumDp),
        verticalArrangement = Arrangement.spacedBy(MediumDp)
    ) {
        TodoItemUi(todoItem = TodoItem(content = "Wash dishes"))
        TodoItemUi(todoItem = TodoItem(content = "Do laundry", isCompleted = true))
        TodoItemUi(todoItem = TodoItem(content = "Clean room"))
        TodoItemUi(todoItem = TodoItem(content = "Buy groceries", isCompleted = true))
    }
}
