<script setup lang="ts">
  import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

  const props = defineProps<{
    open: boolean;
    text: string;
  }>()

  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'confirm'): void;
  }>()


  function cancel() {
    emit('close')
  }

  function confirm() {
    emit('confirm')
  }
  </script>
  
  <template>
    <AlertDialog id="saveToFlomo" :open="open" >
      <AlertDialogContent class="z-[9999999] max-w-md" >
        <AlertDialogHeader>
          <AlertDialogTitle>
            <div class="text-[#333]">是否要保存到 Flomo?</div>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div class="text-sm text-[#666] leading-6 px-2 pt-2" style="letter-spacing: 0.2px;">
              「{{ text }}」
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel class="text-[#333] shadow-md !cursor-pointer !box-border" @click="cancel">&nbsp;&nbsp;取消&nbsp;&nbsp;</AlertDialogCancel>
          <AlertDialogAction class="!cursor-pointer !box-border shadow-md"  @click="confirm">&nbsp;&nbsp;保存&nbsp;&nbsp;</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </template>
  