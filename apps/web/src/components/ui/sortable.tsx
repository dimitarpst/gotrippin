"use client"

import {
  type Announcements,
  closestCenter,
  closestCorners,
  DndContext,
  type DndContextProps,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  DragOverlay,
  type DragStartEvent,
  type DropAnimation,
  defaultDropAnimationSideEffects,
  KeyboardSensor,
  MouseSensor,
  type ScreenReaderInstructions,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers"
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  type SortableContextProps,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Slot } from "@radix-ui/react-slot"
import * as React from "react"
import { useComposedRefs } from "@/lib/compose-refs"
import { cn } from "@/lib/utils"

const orientationConfig = {
  vertical: {
    modifiers: [restrictToVerticalAxis, restrictToParentElement],
    strategy: verticalListSortingStrategy,
    collisionDetection: closestCenter,
  },
  horizontal: {
    modifiers: [restrictToHorizontalAxis, restrictToParentElement],
    strategy: horizontalListSortingStrategy,
    collisionDetection: closestCenter,
  },
  mixed: {
    modifiers: [restrictToParentElement],
    strategy: undefined,
    collisionDetection: closestCorners,
  },
}

const ROOT_NAME = "Sortable"
const CONTENT_NAME = "SortableContent"
const ITEM_NAME = "SortableItem"
const ITEM_HANDLE_NAME = "SortableItemHandle"
const OVERLAY_NAME = "SortableOverlay"

interface SortableRootContextValue<T> {
  id: string
  items: T[]
  ids: UniqueIdentifier[]
  modifiers: DndContextProps["modifiers"]
  strategy: SortableContextProps["strategy"]
  activeId: UniqueIdentifier | null
  setActiveId: (id: UniqueIdentifier | null) => void
  getItemValue: (item: T) => UniqueIdentifier
  flatCursor: boolean
}

const SortableRootContext =
  React.createContext<SortableRootContextValue<unknown> | null>(null)

function useSortableContext(consumerName: string) {
  const context = React.useContext(SortableRootContext)
  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ROOT_NAME}\``)
  }
  return context
}

interface GetItemValue<T> {
  getItemValue: (item: T) => UniqueIdentifier
}

type SortableRootProps<T> = Omit<
  DndContextProps,
  "id" | "sensors" | "onDragStart" | "onDragEnd" | "onDragCancel"
> &
  (T extends object ? GetItemValue<T> : Partial<GetItemValue<T>>) & {
    value: T[]
    onValueChange?: (items: T[]) => void
    onMove?: (
      event: DragEndEvent & { activeIndex: number; overIndex: number },
    ) => void
    strategy?: SortableContextProps["strategy"]
    orientation?: "vertical" | "horizontal" | "mixed"
    flatCursor?: boolean
    sensors?: DndContextProps["sensors"]
  }

function callAll<Args extends unknown[]>(
  ...fns: Array<((...args: Args) => void) | undefined>
) {
  return (...args: Args) => {
    for (const fn of fns) {
      fn?.(...args)
    }
  }
}

function SortableRootInner<T>(props: SortableRootProps<T>) {
  const {
    value,
    onValueChange,
    onMove,
    getItemValue,
    orientation = "vertical",
    strategy: strategyProp,
    flatCursor = false,
    modifiers: modifiersProp,
    sensors: sensorsProp,
    collisionDetection: collisionDetectionProp,
    onDragStart,
    onDragEnd,
    onDragCancel,
    children,
    ...rest
  } = props

  const defaultGetItemValue = React.useCallback(
    (item: T) => {
      if (typeof item === "object" && item !== null && "id" in (item as object)) {
        return (item as { id: UniqueIdentifier }).id
      }
      return item as unknown as UniqueIdentifier
    },
    [],
  )

  const getValue = getItemValue ?? defaultGetItemValue

  const ids = React.useMemo<UniqueIdentifier[]>(
    () => value.map((item) => getValue(item)),
    [value, getValue]
  )

  const orientationSettings = orientationConfig[orientation] ?? orientationConfig.vertical
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null)

  const defaultSensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const sensors = sensorsProp ?? defaultSensors

  const modifiers = modifiersProp ?? orientationSettings.modifiers
  const strategy = strategyProp ?? orientationSettings.strategy
  const collisionDetection =
    collisionDetectionProp ?? orientationSettings.collisionDetection

  const handleDragStart = React.useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active.id)
    },
    []
  )

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const activeIndex = ids.indexOf(active.id)
        const overIndex = ids.indexOf(over.id)

        if (activeIndex !== -1 && overIndex !== -1) {
          const newItems = arrayMove(value, activeIndex, overIndex)
          onValueChange?.(newItems)
          onMove?.({ ...event, activeIndex, overIndex })
        }
      }

      setActiveId(null)
    },
    [ids, onMove, onValueChange, value]
  )

  const handleDragCancel = React.useCallback(() => {
    setActiveId(null)
  }, [])

  const contextValue = React.useMemo(
    () => ({
      id: ROOT_NAME,
      items: value,
      ids,
      modifiers,
      strategy,
      activeId,
      setActiveId,
      getItemValue: getValue,
      flatCursor,
    }),
    [value, ids, modifiers, strategy, activeId, getValue, flatCursor]
  )

  return (
    <SortableRootContext.Provider value={contextValue}>
      <DndContext
        {...rest}
        sensors={sensors}
        modifiers={modifiers}
        collisionDetection={collisionDetection}
        onDragStart={callAll(onDragStart, handleDragStart)}
        onDragEnd={callAll(onDragEnd, handleDragEnd)}
        onDragCancel={callAll(onDragCancel, handleDragCancel)}
      >
        {children}
      </DndContext>
    </SortableRootContext.Provider>
  )
}

const SortableRoot = SortableRootInner as <T>(
  props: SortableRootProps<T>,
) => React.ReactElement

interface SortableContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  strategy?: SortableContextProps["strategy"]
  withoutSlot?: boolean
  asChild?: boolean
}

const SortableContent = React.forwardRef<HTMLDivElement, SortableContentProps>(
  (
    { className, strategy, children, withoutSlot = false, asChild, ...props },
    ref,
  ) => {
    const context = useSortableContext(CONTENT_NAME)
    const Component = asChild ? Slot : "div"

    const content = withoutSlot ? (
      children
    ) : (
      <Component
        ref={ref}
        className={className}
        {...props}
      >
        {children}
      </Component>
    )

    return (
      <SortableContext
        items={context.ids}
        strategy={strategy ?? context.strategy}
      >
        {content}
      </SortableContext>
    )
  },
)
SortableContent.displayName = CONTENT_NAME

interface SortableItemContextValue {
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners | undefined
  setActivatorNodeRef: (element: HTMLElement | null) => void
  isDragging: boolean
  disabled: boolean
}

const SortableItemContext =
  React.createContext<SortableItemContextValue | null>(null)

function useSortableItemContext(consumerName: string) {
  const context = React.useContext(SortableItemContext)
  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ITEM_NAME}\``)
  }
  return context
}

interface SortableItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: UniqueIdentifier
  disabled?: boolean
  asChild?: boolean
  asHandle?: boolean
}

const SortableItem = React.forwardRef<HTMLDivElement, SortableItemProps>(
  ({ value, disabled = false, asChild, asHandle, className, style, children, ...props }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: value,
      disabled,
    })

    const composedRef = useComposedRefs(
      ref,
      setNodeRef,
      asHandle ? (setActivatorNodeRef as React.Ref<HTMLElement>) : undefined,
    )

    const Component = asChild ? Slot : "div"
    const { flatCursor } = useSortableContext(ITEM_NAME)

    const itemStyle: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      pointerEvents: isDragging ? "none" : undefined,
      ...style,
    }

    const componentProps = {
      ref: composedRef,
      className: cn(
        "relative bg-background text-foreground",
        className,
        disabled && "opacity-50",
      ),
      style: itemStyle,
      "data-disabled": disabled ? "" : undefined,
      "data-dragging": isDragging ? "" : undefined,
      ...(asHandle ? { ...attributes, ...listeners } : {}),
      ...props,
    }

    return (
      <SortableItemContext.Provider
        value={{
          attributes,
          listeners,
          setActivatorNodeRef,
          isDragging,
          disabled,
        }}
      >
        <Component {...componentProps}>{children}</Component>
      </SortableItemContext.Provider>
    )
  },
)
SortableItem.displayName = ITEM_NAME

interface SortableItemHandleProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const SortableItemHandle = React.forwardRef<
  HTMLButtonElement,
  SortableItemHandleProps
>(({ className, asChild, ...props }, ref) => {
  const { attributes, listeners, setActivatorNodeRef, disabled } =
    useSortableItemContext(ITEM_HANDLE_NAME)
  const { flatCursor } = useSortableContext(ITEM_HANDLE_NAME)
  const Component = asChild ? Slot : "button"
  const composedRef = useComposedRefs(ref, setActivatorNodeRef)

  return (
    <Component
      ref={composedRef}
      className={cn(
        "select-none rounded-md border border-transparent bg-transparent text-foreground/70 transition-colors hover:text-foreground",
        !flatCursor && "cursor-grab active:cursor-grabbing",
        flatCursor && "cursor-default",
        disabled && "opacity-50",
        className,
      )}
      type={asChild ? undefined : "button"}
      {...attributes}
      {...listeners}
      {...props}
    />
  )
})
SortableItemHandle.displayName = ITEM_HANDLE_NAME

interface SortableOverlayProps extends React.ComponentProps<typeof DragOverlay> {
  children?:
    | React.ReactNode
    | ((activeItem: {
        id: UniqueIdentifier
        index: number
        value: unknown
      }) => React.ReactNode)
}

const defaultDropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0",
      },
    },
  }),
}

const SortableOverlay = ({
  children,
  dropAnimation = defaultDropAnimation,
  ...props
}: SortableOverlayProps) => {
  const context = useSortableContext(OVERLAY_NAME)
  const activeIndex = context.activeId
    ? context.ids.indexOf(context.activeId)
    : -1
  const activeItem =
    activeIndex !== -1 ? context.items[activeIndex] : undefined

  const renderChildren = () => {
    if (!context.activeId || activeIndex === -1 || !children) return null

    if (typeof children === "function") {
      return children({
        id: context.activeId,
        index: activeIndex,
        value: activeItem,
      })
    }

    return children
  }

  return (
    <DragOverlay dropAnimation={dropAnimation} {...props}>
      {renderChildren()}
    </DragOverlay>
  )
}

const Root = SortableRoot
const Content = SortableContent
const Item = SortableItem
const ItemHandle = SortableItemHandle
const Overlay = SortableOverlay

const Sortable = {
  Root,
  Content,
  Item,
  ItemHandle,
  Overlay,
}

export {
  Sortable,
  Root,
  Content,
  Item,
  ItemHandle,
  Overlay,
  SortableRoot,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
}


