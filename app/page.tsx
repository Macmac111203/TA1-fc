"use client"

import type React from "react"

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const bookSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  author: z.string().min(2, {
    message: "Author must be at least 2 characters.",
  }),
  rating: z.number().min(1).max(5).optional(),
})

type Book = z.infer<typeof bookSchema>

const columns: ColumnDef<Book>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "author",
    header: "Author",
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number | undefined
      return rating ? `${rating} Star${rating > 1 ? "s" : ""}` : "No rating"
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const book = row.original
      const { books, setBooks } = (table.options.meta as any) || {}
      return <Actions book={book} books={books} setBooks={setBooks} />
    },
  },
]

function Actions({
  book,
  books,
  setBooks,
}: { book: Book; books: Book[]; setBooks: React.Dispatch<React.SetStateAction<Book[]>> }) {
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const deleteBook = () => {
    const updatedBooks = books.filter((b) => b.title !== book.title && b.author !== book.author)
    setBooks(updatedBooks)
    localStorage.setItem("books", JSON.stringify(updatedBooks))
    setOpen(false)
    toast("Book deleted.")
  }

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the book from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteBook}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </SheetTrigger>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit book</SheetTitle>
            <SheetDescription>Make changes to your book here. Click save when you're done.</SheetDescription>
          </SheetHeader>
          <EditBookForm book={book} setOpen={setEditOpen} books={books} setBooks={setBooks} />
        </SheetContent>
      </Sheet>
    </>
  )
}

function EditBookForm({
  book,
  setOpen,
  books,
  setBooks,
}: {
  book: Book
  setOpen: (open: boolean) => void
  books: Book[]
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>
}) {
  const form = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: book,
  })

  function onSubmit(values: z.infer<typeof bookSchema>) {
    const updatedBooks = books.map((b) => (b.title === book.title && b.author === book.author ? values : b))
    setBooks(updatedBooks)
    localStorage.setItem("books", JSON.stringify(updatedBooks))
    toast("Book updated.")
    setOpen(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Title of the book" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author</FormLabel>
              <FormControl>
                <Input placeholder="Author of the book" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <div className="grid gap-2">
                <Label htmlFor="edit-rating">Rating (1-5)</Label>
                <Select
                  value={field.value?.toString() || "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? undefined : Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No rating</SelectItem>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} Star{rating > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}

function AddBookForm({
  setOpen,
  setBooks,
}: { setOpen: (open: boolean) => void; setBooks: React.Dispatch<React.SetStateAction<Book[]>> }) {
  const form = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      author: "",
    },
  })

  function onSubmit(values: z.infer<typeof bookSchema>) {
    setBooks((prev) => {
      const updatedBooks = [...prev, values]
      localStorage.setItem("books", JSON.stringify(updatedBooks))
      return updatedBooks
    })
    toast("Book added.")
    setOpen(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Title of the book" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author</FormLabel>
              <FormControl>
                <Input placeholder="Author of the book" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <div className="grid gap-2">
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Select
                  value={field.value?.toString() || "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? undefined : Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No rating</SelectItem>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} Star{rating > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}

export default function IndexPage() {
  const [open, setOpen] = useState(false)
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    const storedBooks = localStorage.getItem("books")
    if (storedBooks) {
      setBooks(JSON.parse(storedBooks))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("books", JSON.stringify(books))
  }, [books])

  const table = useReactTable({
    data: books,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      books,
      setBooks,
    },
  })

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Books</h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>Add book</Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Add book</SheetTitle>
              <SheetDescription>Add a new book to your collection. Click save when you're done.</SheetDescription>
            </SheetHeader>
            <AddBookForm setOpen={setOpen} setBooks={setBooks} />
          </SheetContent>
        </Sheet>
      </div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
                      key={header.id}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr className="border-b last:border-0" key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0" key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-4 text-center" colSpan={columns.length}>
                  No books found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
